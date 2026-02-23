# RIME 输入法配置 - only-wb98

- 内置 98 五笔方案和一个辅助的拼音输入法方案
- 没有多余的功能，面向程序员用户
- 默认英文输入，默认启用输入联想

## 安装

1. 从 RIME 项目下载最新的 windows 安装包（需要随便选一个输入法）
2. 在安装完成后，从托盘找到 RIME 输入法图标 -> 鼠标右键 -> 用户文件夹
3. 删除用户文件夹下除 build 文件夹的其他内容（可自行备份）
4. 将本项目下载为 zip 包，解压得到 configs/only-wb98 文件夹
5. 将 configs/only-wb98 文件夹内文件全部移动到用户文件夹
6. 从托盘找到 RIME 输入法图标 -> 鼠标右键 -> 重新部署

> 如果需要和其他方案并存，请自行修改配置。其他操作系统的设置可能类似，但我没有条件验证。

## 快捷键

- <kbd>ctrl+0</kbd> 显示输入法菜单
- <kbd>ctrl+alt+.</kbd> 切换为英文标点符号
- <kbd>,</kbd> 选中候选2号
- <kbd>.</kbd> 选中候选3号
- <kbd>[</kbd> <kbd>]</kbd> 翻页
- <kbd>Enter</kdb> 直接输出编码

注意：没有快捷键直接切换到全角模式，需要进入菜单设置为全角模式。

## 特殊输入：

- <kbd>date</kbd>： 输出当前日期
- <kbd>time</kbd>： 输出当前时间
- <kbd>;</kbd>：快捷输入标点符号
- <kbd>z</kbd>：进入临时拼音
- 大写字母开头：进入临时英文模式

## 词库

- 拼音词库和 98 五笔词库来源自空山明月的 [rime-wubi](https://github.com/myshiqiqi/rime-wubi)
- 权重数据源自 [RIME-LMDB](https://github.com/amzxyz/RIME-LMDG) 项目
- datetime 转换 lua 脚本来自 [86 五笔极点码表](https://github.com/KyleBing/rime-wubi86-jidian)

## TODO

- [ ] 依托 RIME-LMDG 的数据扩充词库
- [ ] 移植空山明月自定义造词功能
