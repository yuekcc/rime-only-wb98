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
	-- M.uuid = env.engine.schema.config:get_string(env.name_space:gsub("^*", "")) or "uuid"
	M.keyword = "uuid"
end

function M.func(input, seg, _)
	if input == M.keyword then
		yield_cand(seg, generate_uuid_v4())
	end
end

return M
