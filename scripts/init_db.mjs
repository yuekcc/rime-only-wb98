import { Database } from 'bun:sqlite'

const createTableSql = `CREATE TABLE "word" (
	"id"	INTEGER UNIQUE,
	"content"	TEXT NOT NULL,
	"length"	INTEGER NOT NULL,
	"weight"	INTEGER NOT NULL,
	"pinyin"	TEXT, source TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
)`

const createIndexSql = `CREATE INDEX "index_content" ON "word" (
	"content"
)`

const pragmaSql = `PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456;
PRAGMA busy_timeout = 5000; -- 防止因锁定导致的繁忙报错，等待 5 秒`

const db = new Database('rime-lmdg-weights.db');
db.run(pragmaSql);
db.run(createTableSql);
db.run(createIndexSql);
db.close()