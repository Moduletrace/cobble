import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BotHookWithNames } from "@/src/types";

/**
 * What a run's hook list covers, the same rule as `list_schedules`: the
 * coordinator sees the whole crew's hooks, each naming the bot that runs
 * it, and a worker's list says it is only its own. The production fault
 * this pins: "No hooks at all" was a scoped list read as a census.
 */
let calls: Array<Record<string, unknown>> = [];
let hooks: BotHookWithNames[] = [];

mock.module("@/src/functions/backend/db/bot-hooks/grab-bot-hooks", () => ({
    default: async (params: Record<string, unknown>) => {
        calls.push(params);

        const bot_id = params.bot_id;

        return bot_id ? hooks.filter((hook) => String(hook.bot_id) == String(bot_id)) : hooks;
    },
}));

const listHooksTool = (await import("./list-hooks-tool")).default;

const push: BotHookWithNames = {
    id: 7,
    title: "GitHub pushes",
    source: "url",
    token_prefix: "hk_abc",
    enabled: 1,
    bot_id: 4,
    bot_name: "Personal Assistant",
    workspace_name: null,
    run_count: 2,
};

const report: BotHookWithNames = {
    id: 9,
    title: "Nightly report",
    source: "url",
    token_prefix: "hk_def",
    enabled: 0,
    bot_id: 1,
    bot_name: "Coordinator",
    workspace_name: null,
    run_count: 0,
};

const signal = new AbortController().signal;

beforeEach(() => {
    calls = [];
    hooks = [];
});

afterAll(() => {
    mock.restore();
});

describe("listHooksTool", () => {
    test("the coordinator reads the whole crew's hooks, each naming its bot", async () => {
        hooks = [push, report];

        const tool = listHooksTool({ user_id: 1, bot_id: 1, is_coordinator: true });
        const answer = await tool.run({ args: {}, signal });

        expect(calls).toEqual([{ user_id: 1 }]);
        expect(answer).toContain(`[bot:4] Personal Assistant: #7 "GitHub pushes"`);
        expect(answer).toContain("in Personal Assistant's own chat");
        expect(answer).toContain(`[bot:1] Coordinator: #9 "Nightly report"`);
        expect(answer).not.toContain("hk_abc");
    });

    test("the coordinator narrows the list to one bot when asked", async () => {
        hooks = [push, report];

        const answer = await listHooksTool({ user_id: 1, bot_id: 1, is_coordinator: true }).run({ args: { bot_id: 4 }, signal });

        expect(calls).toEqual([{ user_id: 1, bot_id: 4 }]);
        expect(answer).toContain("GitHub pushes");
        expect(answer).not.toContain("Nightly report");
    });

    test("the coordinator with no hooks says the crew has none", async () => {
        const tool = listHooksTool({ user_id: 1, bot_id: 1, is_coordinator: true });

        expect(await tool.run({ args: {}, signal })).toBe(`The user's crew has no hooks.`);
        expect(await tool.run({ args: { bot_id: 4 }, signal })).toBe(`Bot [bot:4] has no hooks.`);
    });

    test("a worker reads only its own and passes its bot_id, and the schema takes no bot_id", async () => {
        const tool = listHooksTool({ user_id: 1, bot_id: 9 });
        const answer = await tool.run({ args: {}, signal });

        expect(calls).toEqual([{ user_id: 1, bot_id: 9 }]);
        expect(answer).toBe(`You have no hooks of your own. Other bots' hooks aren't in this list.`);
        expect(tool.schema?.safeParse({}).success).toBe(true);
        expect(tool.schema?.safeParse({ bot_id: 4 }).success).toBe(false);
    });
});