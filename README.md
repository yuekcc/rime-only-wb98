# rime-only-wb98

rime-only-wb98，一个自用的 RIME 输入法配置：

- 内置 98 五笔方案和一个辅助的拼音输入法方案
- 默认英文输入，默认启用输入联想
- 基于 白霜拼音、RIME-LMDG 词频权重
- 没有多余的功能，面向程序员用户

> 原来使用的是空山明月的 rime-wubi，但词库顺序有些不合心意。本着追新的心态，利用更新比较勤快的白霜拼音、RIME-LMDG 的词库权重数据，
> 重刷新了一版词库，再减少一些用不到的功能，于是就得到这个输入法方案。感谢各位大佬的作品🌹🌹🌹

## 安装

1. 从 RIME 项目下载最新的 windows 安装包（先需要随便选一个输入法）
2. 在安装完成后，从托盘找到 RIME 输入法图标 -> 鼠标右键 -> 用户文件夹
3. 删除用户文件夹下内容（除 build 文件夹）
4. 将本项目下载为 zip 包，解压得到 config 文件夹
5. 将 config 文件夹内文件全部移动到用户文件夹
6. 从托盘找到 RIME 输入法图标 -> 鼠标右键 -> 重新部署

> 如果需要和其他方案并存，请自行修改配置。目前只在 windows 11 上验证过，其他操作系统的设置可能类似，暂时没有条件验证。

## 快捷键

- <kbd>ctrl+0</kbd> 显示输入法菜单（减少和 VSCode 的冲突）
- <kbd>ctrl+alt+.</kbd> 切换为英文标点符号
- <kbd>,</kbd> 选中候选2号
- <kbd>.</kbd> 选中候选3号
- <kbd>[</kbd> <kbd>]</kbd> 翻页
- <kbd>Enter</kbd> 直接输出编码

> 没有快捷键直接切换到全角模式，需要进入菜单设置为全角模式。常用的 ctrl+shift+space 太容易冲突。

## 特殊输入：

- <kbd>date</kbd>：当前日期
- <kbd>time</kbd>：当前时间
- <kbd>uuid</kbd>：UUID，如：a0d3f451-e67d-4f00-8e9f-4759975d5db5
- <kbd>;</kbd>：快捷输入标点符号
- <kbd>z</kbd>：进入临时拼音
- 大写字母开头：进入临时英文模式

## 词库及权重数据源

- 98 五笔词库：[空山明月的 rime-wubi](https://github.com/myshiqiqi/rime-wubi)
- 拼音词库：[袖珍简化字拼音](https://github.com/rime/rime-pinyin-simp/tree/master)@Apache-2.0
- 权重数据：[白霜拼音](https://github.com/gaboolic/rime-frost)@GPL3.0，[RIME-LMDB](https://github.com/amzxyz/RIME-LMDG)@CC-BY-4.0

## LICENSE

除非标记来源，否则采用 [CC-BY-4.0](LICENSE)
