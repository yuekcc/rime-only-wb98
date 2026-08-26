-- log_commit.lua 记录录入的字词

local function get_user_home()
    local home = os.getenv("HOME") or os.getenv("USERPROFILE")
    return home or "."
end

local LOG_PATH = get_user_home() .. "/rime_words.txt"

function write_log(text)
    local f = io.open(LOG_PATH, "a")
    if f then
        f:write(text, "\n")
        f:close()
    end
end

local processor = {}

function processor.init(env)
    local ctx = env.engine.context
    if ctx.commit_notifier then
        ctx.commit_notifier:connect(function (cx)
            local text = cx:get_commit_text()
            if text and #text > 0 then
                write_log(text)
            end
        end)
    end
end

function processor.func(input, env)
    -- kNoop, 声称本函数不响应该输入事件，交给接下来的处理器决定
    -- @see https://rimeinn.github.io/plugin/lua/API.html
    return 2 
end

return processor