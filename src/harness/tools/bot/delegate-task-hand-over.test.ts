import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";

/**
 * The task being handed over, and what `handOverTask` answered with it:
 * what a hand-over passes on is the whole point of these tests, so the
 * helper is mocked and its arguments recorded.
 */
let task = {
    id: 27,
    title: "Rewrite the pricing page",
    bot_id: 4,
    workspace_id: 3,
    status: "todo",
} as BUN_SQLITE_COBBLE_TASKS;
let handedArgs: Record<string, unknown> | null = null;
let handed: Record<string, unknown> = {};

mock.module("@/src/functions/backend/db/tasks/grab-run-task", () => ({
    default: async () => task,
}));

mock.module("@/src/functions/backend/db/tasks/hand-over-task", () => ({
    default: async (args: Record<string, unknown>) => {
        handedArgs = args;
        return handed;
    },
}));

const delegateTaskTool = (await import("./delegate-task-tool")).default;

afterAll(() => {
    mock.restore();
});

const worker = { id: 5, name: "Researcher", role: "research", kind: "worker" } as BUN_SQLITE_COBBLE_BOTS;
const signal = new AbortController().signal;

function tool() {
    return delegateTaskTool({
        user_id: 1,
        requester_id: 1,
        session_id: 10,
        requester_name: "Coordinator",
        workers: [worker],
        workspaces: [],
        grabTargets: async () => [worker],
    });
}

beforeEach(() => {
    task = {
        id: 27,
        title: "Rewrite the pricing page",
        bot_id: 4,
        workspace_id: 3,
        status: "todo",
    } as BUN_SQLITE_COBBLE_TASKS;
    handedArgs = null;
    handed = { task, job_id: null, bot_name: "Researcher", workspace_id: 3, joined: "" };
});

describe("delegateTaskTool, handing over a task on a list", () => {
    test("moves it as to do by default: no run is queued", async () => {
        const answer = await tool().run({ args: { bot_id: 5, task_id: 27 }, signal });

        expect(handedArgs?.start).toBe(false);
        expect(handedArgs?.task_id).toBe(27);
        expect(String(answer)).toContain("as to do");
        expect(String(answer)).toContain("Nothing is running");
    });

    test("starts it only with start: true, when the user asked for that", async () => {
        handed = { task, job_id: 318, bot_name: "Researcher", workspace_id: 3, joined: "" };

        const answer = await tool().run({ args: { bot_id: 5, task_id: 27, start: true }, signal });

        expect(handedArgs?.start).toBe(true);
        expect(String(answer)).toContain("is with Researcher now (job #318)");
        expect(String(answer)).toContain("marked doing");
    });

    test("says a hand-over starts nothing, and to ask before it moves", () => {
        expect(tool().description).toContain("Handing a task over never starts it");
        expect(tool().description).toContain("ask first with ask_user");
    });
});