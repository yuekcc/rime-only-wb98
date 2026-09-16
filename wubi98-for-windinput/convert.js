// 读取 wubi98.dict.yaml，从 `...` 行之后逐行处理
// 每行按空白拆分取前三个元素 [text, code, weight]，去空白后用 tab 拼接
// 忽略可能存在的第四个元素

import { readFileSync, writeFileSync } from 'node:fs';

const inputPath = 'wubi98.dict.yaml';
const outputPath = 'wubi98.dict.txt';

const content = readFileSync(inputPath, 'utf8');
const lines = content.split(/\r?\n/);

// 找到 `...` 分隔行，从其后开始
let start = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '...') {
    start = i + 1;
    break;
  }
}

const out = [];
for (let i = start; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue; // 跳过空行
  const parts = line.split(/\s+/); // 按空白拆分并自动去除多余空格
  const [text, code, weight] = parts; // 仅取前三个，忽略第四个
  if (text === undefined || code === undefined || weight === undefined) continue;
  out.push(`${text}\t${code}\t${weight}`);
}

writeFileSync(outputPath, out.join('\n') + (out.length ? '\n' : ''), 'utf8');
console.log(`已处理 ${out.length} 行，输出到 ${outputPath}`);
