#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
export_wubi98_dict.py
=====================
从 wubi_dict.db 导出 wubi98 词库，写入 wubi98.dict.yaml。

处理流程（严格对应需求）：
    1. 从 wubi 表读取同时具备 wubi_code_86 与 wubi_code_98 的记录。
    2. 将 wubi_code_98 按 ',' 分割并去重（保留首次出现顺序）。
    3. 将 weight 按 ',' 分割。
    4. 逐词展开为若干行，每行格式： <word>\t<one_wubi_code_98>\t<one_weight>
       - 一个 wubi_code_98 对应一个 weight；weight 缺失（条数不足或为空）时默认为 10。
    5. 将展开后的全部行按【单个 wubi_code_98】全局排序（同码跨词聚集，word 作次级键保证稳定）。
    6. 以 UTF-8（无 BOM）写入 wubi98.dict.yaml。

    说明：
    - 仅导出同时具备 wubi_code_86 与 wubi_code_98 的记录；
      无 wubi_code_86（86 专属词已在建库时未录入 86 编码）或无 98 编码的词均不写入。
    - 排序在“展开之后”进行，按每一行的单个编码排序，因此整份词库按编码有序。
    - 输出为纯数据行，不含 RIME 头部；如需 RIME dict 头部可后续追加。
"""

import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "wubi_dict.db")
OUT_PATH = os.path.join(BASE_DIR, "wubi98.dict.yaml")
DEFAULT_WEIGHT = "10"


def main():
    if not os.path.exists(DB_PATH):
        raise SystemExit(f"[错误] 找不到数据库: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT word, wubi_code_98, weight
        FROM wubi
        WHERE wubi_code_98 IS NOT NULL AND wubi_code_98 != ''
          AND wubi_code_86 IS NOT NULL AND wubi_code_86 != ''
        """
    )
    rows = cur.fetchall()
    conn.close()

    pairs = []  # (word, code, weight)
    total_pairs = 0
    skipped_empty_code = 0

    for word, code98_raw, weight_raw in rows:
        if not word:
            continue

        # 步骤 2：wubi_code_98 按 ',' 分割并去重（保留首次出现顺序）
        seen = set()
        codes = []
        for c in code98_raw.split(","):
            c = c.strip()
            if not c:
                continue
            if c not in seen:
                seen.add(c)
                codes.append(c)
        if not codes:
            skipped_empty_code += 1
            continue

        # 步骤 3：weight 按 ',' 分割
        if weight_raw:
            weights = [w.strip() for w in weight_raw.split(",")]
        else:
            weights = []

        # 步骤 4：展开为一行一词一码一权重
        for i, c in enumerate(codes):
            w = weights[i] if (i < len(weights) and weights[i] != "") else DEFAULT_WEIGHT
            pairs.append((word, c, w))
            total_pairs += 1

    # 步骤 5：展开后的全部行按【单个 wubi_code_98】全局排序
    #         同码跨词聚集；word 作次级键保证输出稳定、可读。
    pairs.sort(key=lambda x: (x[1], x[0]))

    out_lines = [f"{word}\t{code}\t{w}" for (word, code, w) in pairs]

    # 步骤 6：UTF-8 无 BOM 写入
    with open(OUT_PATH, "w", encoding="utf-8", newline="\n") as f:
        if out_lines:
            f.write("\n".join(out_lines))
            f.write("\n")

    print(f"[导出] 同时含 wubi_code_86 与 wubi_code_98 的来源词数: {len(rows)}")
    if skipped_empty_code:
        print(f"[导出] 编码经分割后全为空的词数: {skipped_empty_code}")
    print(f"[导出] 展开后的词条行数: {total_pairs}")
    print(f"[导出] 已写入: {OUT_PATH}  (UTF-8, 无 BOM)")


if __name__ == "__main__":
    main()
