import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CronJobWithNames } from "@/src/types";

/**
 * What a run's schedule list covers. The production fault this pins: the
 * coordinator asked for the crew's routines and was told "you have no
 * schedules", went on to say the user's morning-email routine had never
 * been created, and was right only about its own bot. The coordinator now
 * reads the user's routines on every bot and each line names the bot that
 * runs it, while a worker's list says it is only its own.
 */
let calls: Array<Record<string, unknown>> = [];
let cron_jobs: CronJobWithNames[] = [];

mock.module("@/src/functions/backend/db/cron-jobs/grab-cron-jobs", () => ({
    default: async (params: Record<string, unknown>) => {
        calls.push(params);

        const bot_id = params.bot_id;

        return bot_id ? cron_jobs.filter((cron_job) => String(cron_job.bot_id) == String(bot_id)) : cron_jobs;
    },
}));

const listSchedulesTool = (await import("./list-schedules-tool")).default;

const morning: CronJobWithNames = {
    id: 12,
    title: "Morning email",
    schedule: "0 8 * * MON-FRI",
    enabled: 1,
    bot_id: 4,
    bot_name: "Personal Assistant",
    workspace_name: null,
    run_count: 3,
};

const weekly: CronJobWithNames = {
    id: 3,
    title: "Weekly report",
    schedule: "0 9 * * MON",
    enabled: 0,
    bot_id: 1,
    bot_name: "Coordinator",
    workspace_name: null,
    run_count: 0,
};

const signal = new AbortController().signal;

beforeEach(() => {
    calls = [];
    cron_jobs = [];
});

afterAll(() => {
    mock.restore();
});

describe("listSchedulesTool", () => {
    test("the coordinator reads the whole crew's routines, each naming its bot", async () => {
        cron_jobs = [morning, weekly];

        const tool = listSchedulesTool({ user_id: 1, bot_id: 1, is_coordinator: true });
        const answer = await tool.run({ args: {}, signal });

        expect(calls).toEqual([{ user_id: 1 }]);
        expect(answer).toContain(`[bot:4] Personal Assistant: #12 "Morning email"`);
        expect(answer).toContain("in Personal Assistant's own chat");
        expect(answer).toContain(`[bot:1] Coordinator: #3 "Weekly report"`);
        expect(answer).toContain("in Coordinator's own chat");
    });

    test("the coordinator narrows the list to one bot when asked", async () => {
        cron_jobs = [morning, weekly];

        const tool = listSchedulesTool({ user_id: 1, bot_id: 1, is_coordinator: true });
        const answer = await tool.run({ args: { bot_id: 4 }, signal });

        expect(calls).toEqual([{ user_id: 1, bot_id: 4 }]);
        expect(answer).toContain("Personal Assistant");
        expect(answer).not.toContain("Weekly report");
    });

    test("the coordinator with an empty install says the crew has none, never that they don't exist", async () => {
        const tool = listSchedulesTool({ user_id: 1, bot_id: 1, is_coordinator: true });

        expect(await tool.run({ args: {}, signal })).toBe(`The user's crew has no schedules.`);
        expect(await tool.run({ args: { bot_id: 4 }, signal })).toBe(`Bot [bot:4] has no schedules.`);
    });

    test("a worker reads only its own, and is told the list isn't a census", async () => {
        const tool = listSchedulesTool({ user_id: 1, bot_id: 9 });
        const answer = await tool.run({ args: {}, signal });

        expect(calls).toEqual([{ user_id: 1, bot_id: 9 }]);
        expect(answer).toBe("You have no schedules of your own. Other bots' routines aren't in this list.");
        expect(tool.description).toContain("another bot's routines are not in this list");
    });

    test("a worker's own routine is listed without a crew prefix", async () => {
        cron_jobs = [{ ...morning, bot_id: 9 }];

        const answer = await listSchedulesTool({ user_id: 1, bot_id: 9 }).run({ args: {}, signal });

        expect(answer).toContain(`#12 "Morning email"`);
        expect(answer).toContain("in your own chat");
        expect(answer).not.toContain("[bot:");
    });

    test("a worker's schema takes no bot_id", () => {
        const tool = listSchedulesTool({ user_id: 1, bot_id: 9 });

        expect(tool.schema?.safeParse({}).success).toBe(true);
        expect(tool.schema?.safeParse({ bot_id: 4 }).success).toBe(false);
    });
});