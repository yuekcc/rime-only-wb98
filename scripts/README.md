# 使用

1. 先从 [https://github.com/amzxyz/RIME-LMDG](https://github.com/amzxyz/RIME-LMDG) 项目下载最新的 `dicts.zip`
2. 解压到 `<repo-root>/scripts/dicts`
3. 复制 `<repo-root>/configs/**/wubi.dict.yaml` 到 `<repo-root>/scripts/wubi.dict.yaml`

```sh
$ # cd 到 <repo-root>/scripts/dicts
$ find
.
./dicts
./dicts/cuoyin.dict.yaml
./dicts/diming.dict.yaml
./dicts/duoyin.dict.yaml
./dicts/jichu.dict.yaml
./dicts/lianxiang.dict.yaml
./dicts/renming.dict.yaml
./dicts/shici.dict.yaml
./dicts/wuzhong.dict.yaml
./dicts/zi.dict.yaml
./init_db.mjs
./README.md
./read_to_db.mjs
./resort.mjs
./wubi.dict.yaml
```

4. 在 `<repo-root>/scripts` 目录执行 `rm rime-lmdg-weights.db && bun run.mjs`
