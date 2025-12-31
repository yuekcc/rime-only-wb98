import { Database } from 'bun:sqlite'
import readline from 'node:readline'
import fs from 'node:fs'

const db = new Database('rime-lmdg-weights.db')


process.on('exit', () => {
    db.close()
})

class Word {
    constructor() {
        this.id = 0;
        this.content = '';
        this.length = 0;
        this.weight = 0;
        this.pinyin = '';
        this.source = '';
    }
}

function lookupWeight(keyword) {
    try {
        const query = db.query(`select id, content, length, weight, pinyin, source from word where content = $content order by weight desc`).as(Word);
        return query.all({ $content: keyword }).at(0)
    } catch (err) {
        console.warn('query keyword error, for', err.message, ', keyword is', keyword)
        return null;
    }
}


function parseLineByLine(dictFile) {
    const { promise, resolve } = Promise.withResolvers()

    const cache = [];
    const stream = fs.createReadStream(dictFile)
    const rl = readline.createInterface({ input: stream })
    let enable = false;
    rl.on('line', line => {
        if (line === '...') {
            enable = true;
            return;
        }

        if (!enable) {
            console.log('ignore line:', line)
            return;
        }

        if (!line || line.startsWith('#')) {
            return;
        }
        const cols = line.split('\t')
        if (cols.length < 3) {
            console.warn(`Expected length >= 3, got ${cols.length}, line = ${line}`)
            return
        }

        const [text, code, weight, stem] = cols;
        const newWeight = lookupWeight(text)?.weight ?? weight;

        if (stem) {
            cache.push([text, code, newWeight, stem].join('\t') + '\n')
        } else {
            cache.push([text, code, newWeight].join('\t') + '\n')
        }
    })

    rl.on('close', () => {
        resolve(cache)
    })

    return promise;
}

const lines = await parseLineByLine('wubi.dict.yaml');
const stream = fs.createWriteStream('out.yaml')
for (const line of lines) {
    stream.write(line, 'utf-8')
}
stream.close()

