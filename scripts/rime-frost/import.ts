import util, { type ParseArgsOptionsConfig } from "node:util";
import zod from "zod";
import { DataSourceTagSchema, Db, type DataSourceTag } from "./db.ts";
import { parseDictYamlFile } from "./dict-yaml-util.ts";


async function createDictDb(
    dictYamlFilePath: string,
    tag: DataSourceTag,
    dbFile: string,
) {
    const data = await parseDictYamlFile(dictYamlFilePath, tag);
    const db = new Db(dbFile);
    db.autoClose();

    let success = 0;
    let error = 0;

    console.log("\n---\nStart inert data, total", data.length);

    for (const dictLine of data) {
        try {
            const columns = [
                "text",
                "weight",
                "code",
                "stem",
                "tag",
                "createdTime",
                "updatedTime",
            ];
            const sql = `insert into dist (${columns.join(", ")}) values (${columns.map(() => "?").join(", ")})`;
            db.exec(sql, [
                dictLine.text,
                dictLine.weight,
                dictLine.code,
                dictLine.stem,
                dictLine.tag,
                dictLine.createdTime.toISOString(),
                dictLine.updatedTime.toISOString(),
            ]);

            success += 1;
        } catch (err) {
            console.log(
                "\tERROR: parse dict line error,",
                err,
                dictLine.text,
                dictLine.code,
            );
        }
    }

    console.log("\n\n---\nFinish, success:", success, " error:", error);
}

const CliFlagSchema = zod.object({
    db: zod.string(),
    dictYaml: zod.string(),
    tag: DataSourceTagSchema,
});

async function main() {
    const flags: ParseArgsOptionsConfig = {
        db: { type: "string", description: "Sqlite 数据库文件" },
        dictYaml: {
            type: "string",
            short: "f",
            description: "RIME 词库（*.dict.yaml)",
        },
        tag: {
            type: "string",
            short: "t",
            description: "词库类型，值可以是 wb86、wb98、pinyin",
        },
    };

    function printUsage() {
        console.log("导入 RIME 词库到数据库");
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
        await createDictDb(cliFlags.dictYaml, cliFlags.tag, cliFlags.db);
    } catch (err) {
        console.error("Parse command line error,", (err as Error).message);
        printUsage();
    }
}

main();
