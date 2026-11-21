import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { CronJobWithNames } from "@/src/types";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";

/**
 * The coordinator handing over a routine it doesn't run. The production
 * trap this pins: the list was widened before the writes, so the
 * coordinator showed the routine and was then told "Schedule #12 not
 * found" because the write looked it up under its own bot. It is resolved
 * as the user's, and handed over from the bot that really runs it.
 */
let looked_up: Array<Record<string, unknown>> = [];
let handed: Array<Record<string, unknown>> = [];

const routine = {
    id: 12,
    title: "Morning email",
    schedule: "0 8 * * MON-FRI",
    enabled: 1,
    bot_id: 4,
    bot_name: "Personal Assistant",
} as CronJobWithNames;

mock.module("@/src/functions/backend/db/bots/assert-user-asked", () => ({
    default: async () => {},
}));
mock.module("@/src/functions/backend/db/cron-jobs/grab-user-cron-job", () => ({
    default: async (params: Record<string, unknown>) => {
        looked_up.push(params);
        return routine;
    },
}));
mock.module("@/src/functions/backend/db/cron-jobs/hand-over-cron-job", () => ({
    default: async (params: Record<string, unknown>) => {
        handed.push(params);

        return {
            cron_job: { ...routine, bot_id: params.to_bot_id, bot_name: "Researcher" },
            joined: "",
            computer_dropped: false,
        };
    },
}));
mock.module("@/src/functions/backend/db/bots/grab-crew-workers", () => ({
    default: async () => [{ id: 5, name: "Researcher", kind: "worker" }],
}));

const handOverScheduleTool = (await import("./hand-over-schedule-tool")).default;

const signal = new AbortController().signal;
const worker = { id: 5, name: "Researcher", kind: "worker" } as BUN_SQLITE_COBBLE_BOTS;

beforeEach(() => {
    looked_up = [];
    handed = [];
});

afterAll(() => {
    mock.restore();
});

describe("handOverScheduleTool for the coordinator", () => {
    test("looks another bot's routine up as the user's and hands it over from its owner", async () => {
        const tool = handOverScheduleTool({
            user_id: 1,
            bot_id: 1,
            is_coordinator: true,
            requester_name: "Coordinator",
            workers: [worker],
        });

        const answer = await tool.run({ args: { schedule_id: 12, bot_id: 5, because: "give it to them" }, signal });

        expect(looked_up).toEqual([{ user_id: 1, cron_job_id: 12 }]);
        expect(handed).toEqual([
            {
                user_id: 1,
                cron_job_id: 12,
                from_bot_id: 4,
                to_bot_id: 5,
                workspace_id: undefined,
                handed_by: "Coordinator",
            },
        ]);
        expect(answer).toContain("Handed over to Researcher");
    });

    test("a worker still looks up only its own", async () => {
        const tool = handOverScheduleTool({
            user_id: 1,
            bot_id: 4,
            requester_name: "Personal Assistant",
            workers: [worker],
        });

        await tool.run({ args: { schedule_id: 12, bot_id: 5, because: "give it to them" }, signal });

        expect(looked_up).toEqual([{ user_id: 1, cron_job_id: 12, bot_id: 4 }]);
        expect(handed[0]?.from_bot_id).toBe(4);
    });
});