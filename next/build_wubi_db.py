#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_wubi_db.py
================
在 next/ 目录下生成一个 SQLite 数据库 wubi_dict.db，将「字/词」映射到五笔编码。

数据库表 wubi 字段：
    id            INTEGER PRIMARY KEY AUTOINCREMENT    -- 额外的唯一 id
    word          TEXT NOT NULL UNIQUE                -- 字/词（唯一）
    wubi_code_86  TEXT                                -- 86 五笔编码（重复时用 ',' 拼接）
    wubi_code_98  TEXT                                -- 98 五笔编码（重复时用 ',' 拼接）
    weight        TEXT                                -- 权重（重复时用 ',' 拼接）
    stem          TEXT                                -- 字根（本脚本无来源数据，默认为空，预留）
    category      TEXT                                -- 类别，默认 'extra'
    -- 说明：word 列带 UNIQUE 约束，SQLite 会自动生成唯一索引支撑按词查询，
    --       因此无需再单独 CREATE INDEX。

数据源（相对本脚本位于 ./data 下）：
    86 目录：
        wubi86/wubi86_jidian.dict.yaml         每行 <字/词>\\t<wubi_code_86>\\t<weight>
        wubi86/wubi86_jidian_extra.dict.yaml    每行 <字/词>\\t<wubi_code_86>（部分可能含 weight）
    98 目录：
        wubi98/98五笔单字表-【单义】.txt         每行 <字/词>\\t<wubi_code_98>
        wubi98/19万词条-【单义】.txt             每行 <字/词>\\t<wubi_code_98>
        wubi98/超集-单义表.txt                   每行 <字/词>\\t<wubi_code_98>

重复数据处理：相同 word 出现多次时，wubi_code_86 / wubi_code_98 / weight
分别用 ',' 拼接收集到的全部取值。

说明：
    - 仅用纯文本方式解析，不依赖任何外部库（使用 Python 标准库 sqlite3）。
    - 编码自动探测：UTF-16(BOM) / UTF-8(BOM) / UTF-8 / GBK / GB18030。
"""

import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA86_DIR = os.path.join(BASE_DIR, "data", "wubi86")
DATA98_DIR = os.path.join(BASE_DIR, "data", "wubi98")
DB_PATH = os.path.join(BASE_DIR, "wubi_dict.db")

# 86 五笔源文件（位于 wubi86 目录）
FILES_86 = [
    "wubi86_jidian.dict.yaml",
    "wubi86_jidian_extra.dict.yaml",
]

# 98 五笔源文件（位于 wubi98 目录）
FILES_98 = [
    "98五笔单字表-【单义】.txt",
    "19万词条-【单义】.txt",
    "超集-单义表.txt",
]

CATEGORY_DEFAULT = "extra"


def read_lines(path):
    """读取文件并按行返回，自动探测编码（UTF-16/UTF-8/GBK）。"""
    with open(path, "rb") as f:
        raw = f.read()

    if raw[:2] in (b"\xff\xfe", b"\xfe\xff"):
        text = raw.decode("utf-16")
    elif raw[:3] == b"\xef\xbb\xbf":
        text = raw.decode("utf-8-sig")
    else:
        text = None
        for enc in ("utf-8", "gbk", "gb18030"):
            try:
                text = raw.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        if text is None:
            text = raw.decode("utf-8", errors="replace")

    return text.splitlines()


def parse_line(line):
    """解析一行，返回 (word, code, weight)；非法行返回 None。"""
    line = line.strip()
    if not line or line.startswith("#") or "\t" not in line:
        return None
    parts = line.split("\t")
    word = parts[0].strip()
    code = parts[1].strip() if len(parts) > 1 else ""
    weight = parts[2].strip() if len(parts) > 2 else ""
    if not word or not code:
        return None
    return word, code, weight


def main():
    # word -> {"c86": [...], "c98": [...], "w": [...]}
    data = {}

    def add(word, code86="", code98="", weight=""):
        e = data.setdefault(word, {"c86": [], "c98": [], "w": []})
        if code86:
            e["c86"].append(code86)
        if code98:
            e["c98"].append(code98)
        if weight:
            e["w"].append(weight)

    # ---- 处理 86 五笔 ----
    for fname in FILES_86:
        path = os.path.join(DATA86_DIR, fname)
        if not os.path.exists(path):
            print(f"[警告] 找不到 86 文件，已跳过: {path}")
            continue
        cnt = 0
        for line in read_lines(path):
            parsed = parse_line(line)
            if parsed is None:
                continue
            word, code, weight = parsed
            add(word, code86=code, weight=weight)
            cnt += 1
        print(f"[86] 已读取 {fname}: {cnt} 行")

    # ---- 处理 98 五笔 ----
    for fname in FILES_98:
        path = os.path.join(DATA98_DIR, fname)
        if not os.path.exists(path):
            print(f"[警告] 找不到 98 文件，已跳过: {path}")
            continue
        cnt = 0
        for line in read_lines(path):
            parsed = parse_line(line)
            if parsed is None:
                continue
            word, code, _weight = parsed  # 98 文件无 weight
            add(word, code98=code)
            cnt += 1
        print(f"[98] 已读取 {fname}: {cnt} 行")

    # ---- 合并并生成记录 ----
    records = []
    for word, e in data.items():
        c86 = ",".join(e["c86"])
        c98 = ",".join(e["c98"])
        w = ",".join(e["w"])
        records.append((word, c86, c98, w, "", CATEGORY_DEFAULT))

    print(f"[合并] 唯一字/词总数: {len(records)}")

    # ---- 写数据库 ----
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"[db] 已删除旧数据库: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS wubi (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            word          TEXT NOT NULL UNIQUE,
            wubi_code_86  TEXT,
            wubi_code_98  TEXT,
            weight        TEXT,
            stem          TEXT,
            category      TEXT
        )
        """
    )
    cur.executemany(
        """
        INSERT INTO wubi (word, wubi_code_86, wubi_code_98, weight, stem, category)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        records,
    )
    # word 上的 UNIQUE 约束会自动生成唯一索引（sqlite_autoindex_wubi_N），
    # 已足够支撑按词查询，无需再手动建二级索引。
    conn.commit()

    # ---- 统计输出 ----
    cur.execute("SELECT COUNT(*) FROM wubi")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM wubi WHERE wubi_code_86 IS NOT NULL AND wubi_code_86 != ''")
    n86 = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM wubi WHERE wubi_code_98 IS NOT NULL AND wubi_code_98 != ''")
    n98 = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM wubi WHERE wubi_code_86 != '' AND wubi_code_98 != ''")
    n_both = cur.fetchone()[0]
    conn.close()

    print(f"[db] 数据库已生成: {DB_PATH}")
    print(f"[db] 总记录数: {total}")
    print(f"[db] 含 86 编码: {n86}")
    print(f"[db] 含 98 编码: {n98}")
    print(f"[db] 同时含 86 与 98 编码: {n_both}")


if __name__ == "__main__":
    main()
