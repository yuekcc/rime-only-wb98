-- 来源：https://github.com/iDvel/rime-ice/blob/main/lua/uuid.lua
-- 有少量修改

local fmt = string.format
local rand = math.random
local randomseed = math.randomseed

local function generate_uuid_v4()
	return fmt(
		"%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		((rand(0, 255) % 16) + 64),
		rand(0, 255),
		((rand(0, 255) % 64) + 128),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255),
		rand(0, 255)
	)
end

local M = {}

function M.init(env)
	randomseed(math.floor(os.time() + os.clock() * 1000))
	M.keyword = "uuid"
end

function M.func(input, seg, _)
	if input == M.keyword then
		yield(Candidate("uuid", seg.start, seg._end, generate_uuid_v4(), ""))
	end
end

function uuid_translator(input, seg, env)
	if not M.initialized then
        M.init(env)
        M.initialized = true
    end

	M.func(input, seg, env)
end

return uuid_translator
