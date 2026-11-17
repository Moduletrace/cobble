import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";

/**
 * A `start_task` called while answering a crew request carries the ask_id
 * into the child run's params, so the run's result goes back to the bot that
 * asked (onAskJobEnded) instead of only landing in this conversation. With
 * no open request the child is an ordinary run. The tool's closing line
 * changes too: part of a request, it must not coach the "I'll report back"
 * promise the lifecycle used to fault.
 */
let open_ask: BUN_SQLITE_COBBLE_BOT_ASKS | null = null;
const calls: Array<Record<string, unknown> | undefined> = [];
const signal = new AbortController().signal;

mock.module("@/src/functions/backend/db/bots-queue/grab-open-bot-task", () => ({
    default: async () => null,
}));
mock.module("@/src/functions/backend/db/asks/grab-open-ask-by-session", () => ({
    default: async () => open_ask,
}));
mock.module("@/src/functions/backend/db/bots-queue/enqueue-bot-job", () => ({
    default: async ({ params }: { params?: Record<string, unknown> }) => {
        calls.push(params);
        return 492;
    },
}));

const startTaskTool = (await import("./start-task-tool")).default;

afterAll(() => {
    mock.restore();
});

beforeEach(() => {
    open_ask = null;
    calls.length = 0;
});

const brief = { title: "Render the post", instructions: "Build it." };

describe("startTaskTool ask propagation", () => {
    test("a run started while answering a request carries the ask_id", async () => {
        open_ask = { id: 3, status: "working" } as BUN_SQLITE_COBBLE_BOT_ASKS;
        const tool = startTaskTool({ user_id: 1, bot_id: 3, session_id: 67, computers: [] });

        const answer = await tool.run({ args: brief, signal });

        expect(calls[0]?.ask_id).toBe(3);
        expect(String(answer)).toContain("part of the request another bot passed on");
        expect(String(answer)).not.toContain("I'll report back");
    });

    test("an ordinary run carries no ask_id and keeps the usual closing line", async () => {
        const tool = startTaskTool({ user_id: 1, bot_id: 3, session_id: 67, computers: [] });

        const answer = await tool.run({ args: brief, signal });

        expect(calls[0]?.ask_id).toBeUndefined();
        expect(String(answer)).toContain("the result will be posted here when it's done");
    });

    test("the ask_id rides beside the step budget and browser kind", async () => {
        open_ask = { id: 3, status: "working" } as BUN_SQLITE_COBBLE_BOT_ASKS;
        const tool = startTaskTool({ user_id: 1, bot_id: 3, session_id: 67, computers: [], run_kind: "attended" });

        await tool.run({ args: { ...brief, max_steps: 70 }, signal });

        expect(calls[0]?.ask_id).toBe(3);
        expect(calls[0]?.max_steps).toBe(70);
        expect(calls[0]?.run_kind).toBe("attended");
    });
});
