import fs from "node:fs";
import { DatabaseSync, StatementSync } from "node:sqlite";
import zod from "zod";

export const DataSourceTagSchema = zod.enum(["wb98", "wb86", "pinyin"]);

export type DataSourceTag = zod.infer<typeof DataSourceTagSchema>;

export const DictLineSchema = zod.object({
    text: zod.string(),
    weight: zod.number(),
    code: zod.string(),
    stem: zod.nullable(zod.string()),
    tag: DataSourceTagSchema,
    createdTime: zod.date(),
    updatedTime: zod.date(),
});

export type DictLine = zod.infer<typeof DictLineSchema>;

function initDb(dbFile: string) {
    if (fs.existsSync(dbFile)) {
        return new DatabaseSync(dbFile);
    }

    const db = new DatabaseSync(dbFile);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA synchronous = NORMAL");

    const schemaSql = `
        CREATE TABLE IF NOT EXISTS dict (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            weight INTEGER NOT NULL,
            code TEXT,
            stem TEXT,
            tag TEXT NOT NULL,
            createdTime TEXT NOT NULL,
            updatedTime TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_dist_text ON dist (text);
        CREATE INDEX IF NOT EXISTS idx_dist_tag ON dist (tag);
        CREATE INDEX IF NOT EXISTS idx_dist_code ON dist (code);
    `;
    db.exec(schemaSql);
    return db;
}

export class Db {
    #dbFile;
    #db: DatabaseSync | undefined;
    #stmtCache = new Map<string, StatementSync>();

    constructor(dbFile: string) {
        this.#dbFile = dbFile;
        this.#db = initDb(this.#dbFile);
    }

    close() {
        if (this.#db) {
            this.#db.close;
            this.#db = undefined;
            this.#stmtCache.clear();
        }
    }

    autoClose() {
        process.on("exit", () => {
            this.#db?.close();
        });
    }

    query(sql: string, params: any[] = []) {
        let stmt: StatementSync;
        if (this.#stmtCache.has(sql)) {
            stmt = this.#stmtCache.get(sql)!;
        } else {
            const newStmt = this.#db?.prepare(sql);
            if (newStmt) {
                stmt = newStmt;
                this.#stmtCache.set(sql, newStmt);
            } else {
                throw new Error("prepare query statement error, get undefined");
            }
        }

        return stmt.all(...params);
    }

    exec(sql: string, params: any[] = []) {
        let stmt: StatementSync;
        if (this.#stmtCache.has(sql)) {
            stmt = this.#stmtCache.get(sql)!;
        } else {
            const newStmt = this.#db?.prepare(sql);
            if (newStmt) {
                stmt = newStmt;
                this.#stmtCache.set(sql, newStmt);
            } else {
                throw new Error("prepare query statement error, get undefined");
            }
        }

        stmt.run(...params);
    }
}
