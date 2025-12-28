import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'
import { Database } from 'bun:sqlite'

const db = new Database('rime-lmdg-weights.db')

function trim(x) {
    return `${x ?? ''}`.trim()
}

function addRecord({ content, length, weight, pinyin, source }) {
    const query = db.query(`insert into word (content, length, weight, pinyin, source) values ($content, $length, $weight, $pinyin, $source)`)
    query.get({
        $content: content,
        $length: length,
        $weight: weight,
        $pinyin: pinyin,
        $source: source,
    })
}

function readLines(file) {
    const source = path.basename(file)

    const { promise, resolve } = Promise.withResolvers()
    const stream = fs.createReadStream('jichu.dict.yaml')
    const rl = readline.createInterface({ input: stream })

    let enable = false;

    rl.on('close', () => {
        resolve()
    })

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
        if (cols.length != 3) {
            console.warn(`Expected length = 3, got ${cols.length}, line = ${line}`)
            return
        }

        console.log(cols)
        addRecord({
            content: trim(cols[0]),
            length: trim(cols[0]).length,
            weight: parseInt(cols[2] ?? '1'),
            pinyin: trim(cols[1]),
            source: source
        })
    })

    return promise;
}

await readLines('zi.dict.yaml')
await readLines('jichu.dict.yaml')
