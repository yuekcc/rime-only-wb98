import type { DataSourceTag, DictLine } from "./db.ts";
import fs from "node:fs";
import readline from "node:readline/promises";

export async function parseDictYamlFile(
    filePath: string,
    dataSourceTag: DataSourceTag,
): Promise<DictLine[]> {
    const result: DictLine[] = [];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
    });

    let startPickData = false;
    for await (const line of rl) {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) {
            continue;
        }

        if (startPickData) {
            const now = new Date();
            const [text, code, weight, stem] = lineTrimmed.split("\t");
            if (text && code) {
                result.push({
                    text: text,
                    code: code,
                    weight: parseInt(`${weight ?? 0}`),
                    stem: stem ?? null,
                    tag: dataSourceTag,
                    createdTime: now,
                    updatedTime: now,
                });
            }
        }

        if (lineTrimmed === "...") {
            startPickData = true;
            continue;
        }
    }

    return result;
}