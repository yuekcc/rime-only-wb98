import { Database } from 'bun:sqlite'
import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'

// ==================== 配置 ====================
const DB_PATH = 'rime-lmdg-weights.db'
const OUTPUT_FILE = 'out.yaml'
const DICT_FILES = ['dicts/zi.dict.yaml', 'dicts/jichu.dict.yaml']
const SOURCE_DICT = 'wubi.dict.yaml'

// ==================== 统计数据 ====================
const stats = {
    database: {
        tablesCreated: 0,
        recordsInserted: 0,
        bySource: {}
    },
    processing: {
        linesProcessed: 0,
        weightUpdated: 0,
        weightUnchanged: 0,
        errors: 0
    }
}

// ==================== 数据库操作 ====================
const CREATE_TABLE_SQL = `CREATE TABLE "word" (
	"id"	INTEGER UNIQUE,
	"content"	TEXT NOT NULL,
	"length"	INTEGER NOT NULL,
	"weight"	TEXT NOT NULL,
	"pinyin"	TEXT,
	"source"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
)`

const CREATE_INDEX_SQL = `CREATE INDEX "index_content" ON "word" ("content")`

const PRAGMA_SQL = `PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;
PRAGMA busy_timeout = 5000;`

class Word {
    id = 0
    content = ''
    length = 0
    weight = ''
    pinyin = ''
    source = ''
}

function openDatabase() {
    const db = new Database(DB_PATH)
    db.run(PRAGMA_SQL)
    console.log(`[数据库] 已连接: ${DB_PATH}`)
    return db
}

function initDatabase(db) {
    db.run(CREATE_TABLE_SQL)
    db.run(CREATE_INDEX_SQL)
    stats.database.tablesCreated = 1
    console.log('[数据库] 表和索引已创建')
}

// ==================== 工具函数 ====================
function trim(x) {
    return `${x ?? ''}`.trim()
}

function shouldSkipLine(line) {
    return !line || line.startsWith('#')
}

// ==================== 文件读取通用逻辑 ====================
function readDictLines(file, onLine, options = {}) {
    const { silent = false } = options
    const source = path.basename(file)
    const { promise, resolve } = Promise.withResolvers()
    const stream = fs.createReadStream(file)
    const rl = readline.createInterface({ input: stream })
    let enable = false
    let dataLines = 0

    rl.on('line', line => {
        if (line === '...') {
            enable = true
            return
        }

        if (!enable) {
            return
        }

        if (shouldSkipLine(line)) {
            return
        }

        dataLines++
        onLine(line, source)
    })

    rl.on('close', () => {
        if (!silent && dataLines > 0) {
            console.log(`  已处理 ${dataLines} 行数据`)
        }
        resolve(dataLines)
    })

    return promise
}

// ==================== 数据写入数据库 ====================
function addRecord(db, { content, length, weight, pinyin, source }) {
    const query = db.query(
        `insert into word (content, length, weight, pinyin, source) values ($content, $length, $weight, $pinyin, $source)`
    )
    query.get({
        $content: content,
        $length: length,
        $weight: weight,
        $pinyin: pinyin,
        $source: source,
    })
    stats.database.recordsInserted++
    stats.database.bySource[source] = (stats.database.bySource[source] || 0) + 1
}

function loadDictsToDatabase(db, dictFiles) {
    console.log('[数据加载] 开始加载字典数据到数据库...')
    return Promise.all(dictFiles.map(file =>
        readDictLines(file, (line) => {
            const cols = line.split('\t')
            if (cols.length !== 3) {
                console.warn(`  警告: 期望3列，实际${cols.length}列: ${line}`)
                stats.processing.errors++
                return
            }

            addRecord(db, {
                content: trim(cols[0]),
                length: trim(cols[0]).length,
                weight: cols[2] ?? '1',
                pinyin: trim(cols[1]),
                source: path.basename(file)
            })
        })
    ))
}

// ==================== 权重查询 ====================
function lookupWeight(db, keyword) {
    try {
        const query = db.query(
            `select id, content, length, weight, pinyin, source from word where content = $content order by CAST(weight AS INTEGER) desc`
        ).as(Word)
        return query.all({ $content: keyword }).at(0)
    } catch (err) {
        console.warn(`  查询失败: ${keyword} - ${err.message}`)
        stats.processing.errors++
        return null
    }
}

// ==================== 重新排序并输出 ====================
function processAndResortDict(db, sourceDict, outputFile) {
    const cache = []
    console.log('[权重处理] 开始处理源字典并重新排序...')

    return readDictLines(sourceDict, (line) => {
        const cols = line.split('\t')
        if (cols.length < 3) {
            console.warn(`  警告: 期望>=3列，实际${cols.length}列: ${line}`)
            stats.processing.errors++
            return
        }

        const [text, code, weight, stem] = cols
        const result = lookupWeight(db, text)
        const newWeight = result?.weight ?? weight

        stats.processing.linesProcessed++
        if (result) {
            stats.processing.weightUpdated++
        } else {
            stats.processing.weightUnchanged++
        }

        if (stem) {
            cache.push([text, code, newWeight, stem].join('\t') + '\n')
        } else {
            cache.push([text, code, newWeight].join('\t') + '\n')
        }
    }).then(() => {
        const stream = fs.createWriteStream(outputFile)
        for (const line of cache) {
            stream.write(line, 'utf-8')
        }
        stream.close()
        console.log(`[输出] 已写入 ${cache.length} 行到 ${outputFile}`)
    })
}

// ==================== 报告输出 ====================
function printReport() {
    console.log('\n' + '='.repeat(50))
    console.log('处理报告')
    console.log('='.repeat(50))

    console.log('\n数据库统计:')
    console.log(`  表数量: ${stats.database.tablesCreated}`)
    console.log(`  总记录数: ${stats.database.recordsInserted}`)
    if (Object.keys(stats.database.bySource).length > 0) {
        console.log('  按来源统计:')
        for (const [source, count] of Object.entries(stats.database.bySource)) {
            console.log(`    ${source}: ${count}`)
        }
    }

    console.log('\n处理统计:')
    console.log(`  处理行数: ${stats.processing.linesProcessed}`)
    console.log(`  权重更新: ${stats.processing.weightUpdated}`)
    console.log(`  权重未变: ${stats.processing.weightUnchanged}`)
    if (stats.processing.errors > 0) {
        console.log(`  错误数量: ${stats.processing.errors}`)
    }

    console.log('\n' + '='.repeat(50))
}

// ==================== 主流程 ====================
async function main() {
    const startTime = Date.now()
    const db = openDatabase()

    try {
        initDatabase(db)
        await loadDictsToDatabase(db, DICT_FILES)
        await processAndResortDict(db, SOURCE_DICT, OUTPUT_FILE)
    } finally {
        db.close()
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`\n[完成] 耗时: ${elapsed} 秒`)
        printReport()
    }
}

main().catch(err => {
    console.error('\n[错误] 处理失败:', err.message)
    if (err.stack) {
        console.error(err.stack)
    }
    process.exit(1)
})
