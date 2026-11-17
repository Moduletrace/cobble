import { afterAll, describe, expect, mock, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import startTaskTool from "./start-task-tool";

const tool = startTaskTool({ user_id: 1, bot_id: 5, session_id: 9, computers: [] });

/**
 * The step budget the queuing bot sets, kept to what needs no database:
 * `runBotTask` caps the run at it, below the install's limit.
 */
describe("startTaskTool", () => {
    test("takes a step budget within the app's limit", () => {
        const brief = { title: "Find the contest", instructions: "Look it up." };

        expect(tool.schema?.safeParse({ ...brief, max_steps: 20 }).success).toBe(true);
        expect(tool.schema?.safeParse(brief).success).toBe(true);
        expect(tool.schema?.safeParse({ ...brief, max_steps: 0 }).success).toBe(false);
        expect(tool.schema?.safeParse({ ...brief, max_steps: AppData.BotStepLimitMax + 1 }).success).toBe(false);
    });
});

/**
 * H7: the parent reply's browser kind rides into the child run's params, so
 * a hidden session's reply can't hand its child a way to the user's browsers
 * even if the session check ever misses. No computer here, so the only
 * database calls are the open-run check and the enqueue itself.
 */
describe("startTaskTool run_kind propagation", () => {
    const calls: Array<Record<string, unknown> | undefined> = [];
    const signal = new AbortController().signal;

    mock.module("@/src/functions/backend/db/bots-queue/grab-open-bot-task", () => ({
        default: async () => null,
    }));
    mock.module("@/src/functions/backend/db/bots-queue/enqueue-bot-job", () => ({
        default: async ({ params }: { params?: Record<string, unknown> }) => {
            calls.push(params);
            return 77;
        },
    }));

    afterAll(() => {
        mock.restore();
    });

    test("hands the parent's unattended kind to the child", async () => {
        const { default: make } = await import("./start-task-tool");
        const child = make({ user_id: 1, bot_id: 5, session_id: 9, computers: [], run_kind: "unattended" });
        calls.length = 0;

        await child.run({ args: { title: "Read the inbox", instructions: "Summarise it." }, signal });

        expect(calls[0]?.run_kind).toBe("unattended");
    });

    test("keeps an attended parent's kind, and the step budget beside it", async () => {
        const { default: make } = await import("./start-task-tool");
        const child = make({ user_id: 1, bot_id: 5, session_id: 9, computers: [], run_kind: "attended" });
        calls.length = 0;

        await child.run({ args: { title: "Read the inbox", instructions: "Summarise it.", max_steps: 20 }, signal });

        expect(calls[0]?.run_kind).toBe("attended");
        expect(calls[0]?.max_steps).toBe(20);
    });

    test("a parent with no kind leaves the child to its own session check", async () => {
        const { default: make } = await import("./start-task-tool");
        const child = make({ user_id: 1, bot_id: 5, session_id: 9, computers: [] });
        calls.length = 0;

        await child.run({ args: { title: "Read the inbox", instructions: "Summarise it." }, signal });

        expect(calls[0]?.run_kind).toBeUndefined();
    });
});
