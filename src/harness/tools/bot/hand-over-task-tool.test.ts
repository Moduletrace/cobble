import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import type { BotRunPowers } from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";

/**
 * What `grabRunTask` answers: the task it would act on.
 */
let task: BUN_SQLITE_COBBLE_TASKS = {
    id: 43,
    title: "Cut the LCP on the homepage",
    bot_id: 2,
    workspace_id: 2,
    status: "todo",
} as BUN_SQLITE_COBBLE_TASKS;

/**
 * What `handOverTask` answers, and with which arguments it was called: a
 * worker's hand-over has to carry the bot that had the task and the session
 * the result is reported back to.
 */
let handed: Record<string, unknown> = {};
let handedArgs: Record<string, unknown> | null = null;

mock.module("@/src/functions/backend/db/tasks/grab-run-task", () => ({
    default: async () => task,
}));

mock.module("@/src/functions/backend/db/tasks/hand-over-task", () => ({
    default: async (args: Record<string, unknown>) => {
        handedArgs = args;
        return handed;
    },
}));

const handOverTaskTool = (await import("./hand-over-task-tool")).default;

afterAll(() => {
    mock.restore();
});

const bot = { id: 2, name: "SEO Expert", kind: "worker" } as BUN_SQLITE_COBBLE_BOTS;
const engineer = { id: 6, name: "Software Engineer", kind: "worker" } as BUN_SQLITE_COBBLE_BOTS;
const designer = { id: 3, name: "Graphic Designer", kind: "worker" } as BUN_SQLITE_COBBLE_BOTS;

const powers = {
    bot_types: [],
    is_coordinator: false,
    admin_workspace_ids: [],
    is_workspace_admin: false,
    can: (permission: string) => permission == "hand_over_task",
} as unknown as BotRunPowers;

beforeEach(() => {
    task = { id: 43, title: "Cut the LCP on the homepage", bot_id: 2, workspace_id: 2, status: "todo" } as BUN_SQLITE_COBBLE_TASKS;
    handed = { task, job_id: 312, bot_name: "Software Engineer", workspace_id: 2, joined: "" };
    handedArgs = null;
});

function build({ targets = [engineer, designer], onTask }: { targets?: BUN_SQLITE_COBBLE_BOTS[]; onTask?: (params: { task_id: number }) => void } = {}) {
    return handOverTaskTool({
        user_id: 1,
        bot,
        session_id: 43,
        powers,
        workers: targets,
        grabTargets: async () => targets,
        onTask,
    });
}

describe("handOverTaskTool", () => {
    test("takes a task of its own and one of the bots it can ask", () => {
        const tool = build();

        expect(tool.name).toBe("hand_over_task");
        expect(tool.schema?.safeParse({ task_id: 43, bot_id: 6 }).success).toBe(true);
        expect(tool.schema?.safeParse({ task_id: 43, bot_id: 6, start: false }).success).toBe(true);
        expect(tool.schema?.safeParse({ bot_id: 6 }).success).toBe(false);
    });

    test("names the crew it can hand to", () => {
        const tool = build();

        expect(tool.description).toContain("6: Software Engineer; 3: Graphic Designer");
    });

    test("hands the task over with the bot and session to report back to", async () => {
        const answer = await build().run({ args: { task_id: 43, bot_id: 6 }, signal: new AbortController().signal });

        expect(handedArgs?.task_id).toBe(43);
        expect(handedArgs?.to_bot_id).toBe(6);
        expect(handedArgs?.user_id).toBe(1);
        expect(handedArgs?.handed_by).toBe("SEO Expert");
        expect(handedArgs?.requested_by_bot_id).toBe(2);
        expect(handedArgs?.requested_by_session_id).toBe(43);
        expect(handedArgs?.start).toBe(true);
        expect(String(answer)).toContain("is with Software Engineer now (job #312)");
        expect(String(answer)).toContain("it's off your list");
        expect(String(answer)).toContain("their result is reported back here");
    });

    test("the same task, not a copy: it reports the new bot's joined note", async () => {
        handed = { task, job_id: 312, bot_name: "Software Engineer", workspace_id: 2, joined: "It joined the workspace." };

        const answer = await build().run({ args: { task_id: 43, bot_id: 6 }, signal: new AbortController().signal });

        expect(String(answer)).toContain("It joined the workspace.");
    });

    test("start: false only moves it, and says nothing is running", async () => {
        handed = { task, job_id: null, bot_name: "Software Engineer", workspace_id: 2, joined: "" };

        const answer = await build().run({ args: { task_id: 43, bot_id: 6, start: false }, signal: new AbortController().signal });

        expect(handedArgs?.start).toBe(false);
        expect(String(answer)).toContain("as to do");
        expect(String(answer)).toContain("Nothing is running");
    });

    test("reports the task it touched, so the message links it", async () => {
        const touched: number[] = [];

        await build({ onTask: ({ task_id }) => touched.push(task_id) }).run({ args: { task_id: 43, bot_id: 6 }, signal: new AbortController().signal });

        expect(touched).toEqual([43]);
    });

    test("refuses a task that isn't its own", async () => {
        task = { id: 44, title: "Someone else's", bot_id: 9, workspace_id: 2, status: "todo" } as BUN_SQLITE_COBBLE_TASKS;

        await expect(build().run({ args: { task_id: 44, bot_id: 6 }, signal: new AbortController().signal })).rejects.toThrow(
            "isn't on your own list (it's another bot's), so it isn't yours to hand over",
        );

        expect(handedArgs).toBeNull();
    });

    test("refuses a workspace-wide task", async () => {
        task = { id: 44, title: "Everyone's", bot_id: null, workspace_id: 2, status: "todo" } as unknown as BUN_SQLITE_COBBLE_TASKS;

        await expect(build().run({ args: { task_id: 44, bot_id: 6 }, signal: new AbortController().signal })).rejects.toThrow("(it's workspace-wide)");
    });

    test("refuses a bot it can't ask, and lists the ones it can", async () => {
        await expect(build().run({ args: { task_id: 43, bot_id: 99 }, signal: new AbortController().signal })).rejects.toThrow(
            "No bot has id 99 among the ones you can hand to. Bot: 6: Software Engineer; 3: Graphic Designer.",
        );

        expect(handedArgs).toBeNull();
    });

    test("with no crew says so", async () => {
        const tool = build({ targets: [] });

        expect(tool.description).toContain("Crew you can hand to: none.");

        await expect(tool.run({ args: { task_id: 43, bot_id: 6 }, signal: new AbortController().signal })).rejects.toThrow(
            "No bot has id 6 among the ones you can hand to. Bot: none.",
        );
    });
});