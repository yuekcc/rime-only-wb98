import util, { type ParseArgsOptionsConfig } from "node:util";
import zod from "zod";
import fs from "node:fs/promises";
import { parseDictYamlFile } from "./dict-yaml-util.ts";
import { Db, type DictLine } from "./db.ts";

function renderDictLine(dictLine: DictLine) {
    return [dictLine.text, dictLine.code, dictLine.weight, dictLine.stem].join(
        "\t",
    );
}

async function parseFile(wb98DictYamlPath: string, dbFile: string) {
    const data = await parseDictYamlFile(wb98DictYamlPath, "wb98");

    const db = new Db(dbFile);
    const sql = `select text, code, stem, tag, weight from dict where text = ? and length(code) = ?`;

    const updatedDict = [];
    for (const dictLine of data) {
        const res = db.query(sql, [dictLine.text, dictLine.code.length]);
        // console.log('found', res)
        if (Array.isArray(res) && res.length > 0) {
            dictLine.weight = res[0].weight;
        }

        // updatedDict.push(dictLine);
        await fs.appendFile("out.dict.yaml", renderDictLine(dictLine).trim() + "\n");
    }

    // console.log(updatedDict)
}

const CliFlagSchema = zod.object({
    db: zod.string(),
    targetDictYaml: zod.string(),
});

async function main() {
    const flags: ParseArgsOptionsConfig = {
        db: { type: "string", description: "Sqlite 数据库文件" },
        targetDictYaml: {
            type: "string",
            short: "f",
            description: "WB98 RIME 词库（*.dict.yaml)",
        },
    };

    function printUsage() {
        console.log("更新 WB98 词库权重");
        Object.entries(flags).forEach(([key, decl]) => {
            const shortFlag = decl.short ? `, -${decl.short}` : "";
            console.log(`    --${key}${shortFlag}    ${decl.description}`);
        });
    }

    try {
        const { values: rawCliFlags, positionals } = util.parseArgs({
            args: process.argv.slice(2),
            options: flags,
        });

        const cliFlags = CliFlagSchema.parse(rawCliFlags);
        await parseFile(cliFlags.targetDictYaml, cliFlags.db);
    } catch (err) {
        console.error("Parse command line error,", (err as Error).message);
        printUsage();
    }
}

main();
