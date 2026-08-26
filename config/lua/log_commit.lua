-- log_commit.lua (高性能 + 自动创建目录)
-- 记录录入的字词

local function get_user_home()
    local home = os.getenv("HOME") or os.getenv("USERPROFILE")
    return home or "."
end

local function ensure_dir_exists(path)
    -- 尝试创建目录，忽略已存在的错误
    -- 类 Unix 用 mkdir -p，Windows 用 mkdir （加参数）
    local is_windows = string.match(os.getenv("OS") or "", "Windows") ~= nil
    local cmd
    if is_windows then
        -- Windows 下 mkdir 默认会创建多级目录（但路径需用反斜杠或双引号）
        cmd = 'mkdir "' .. path:gsub("/", "\\") .. '" 2>nul'
    else
        -- Linux / macOS
        cmd = 'mkdir -p "' .. path .. '" 2>/dev/null'
    end
    os.execute(cmd)
end

local LOG_DIR = get_user_home() .. "/.config/rime"
local LOG_PATH = LOG_DIR .. "/words.txt"

-- 确保目录存在（在加载模块时就创建，避免后续反复检查）
ensure_dir_exists(LOG_DIR)

-- 打开文件（保持常驻）
local log_file, err = io.open(LOG_PATH, "a")
if not log_file then
    -- 如果打开失败（比如权限问题），置为 nil，后续会尝试重新打开
    log_file = nil
else
    log_file:setvbuf("line")  -- 行缓冲
end

-- 重试打开函数
local function reopen_log_file()
    if not log_file then
        ensure_dir_exists(LOG_DIR)      -- 再次尝试创建目录（可能被删除）
        log_file = io.open(LOG_PATH, "a")
        if log_file then
            log_file:setvbuf("line")
        end
    end
    return log_file
end

function commit(ctx, env)
    local text = ctx:get_commit_text()
    if not text or text == "" then
        return
    end

    local f = log_file or reopen_log_file()
    if not f then
        return
    end

    f:write(text, "\n")
end