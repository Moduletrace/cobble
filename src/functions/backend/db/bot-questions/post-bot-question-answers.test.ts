import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BotQuestionView } from "@/src/types";

/**
 * The answers to a bot's questions as the conversation receives them. The
 * production fault this pins: session 135's bot asked in Plan mode, the
 * user answered on the card, and the answer was queued as an ordinary
 * reply, so the write tools came back and it proposed a custom tool the
 * user never asked for. Answering a question is not a way out of the mode.
 *
 * The side-effect helpers are mocked; the branch under test is the one that
 * carries the mode from the card onto the message and the job.
 */
let question: {
    bot_id: number;
    session_id: number;
    workspace_id: number | null;
    plan_mode: number;
    plan_id?: number | null;
};
let inserted: Array<Record<string, unknown>> = [];
let enqueued: Array<Record<string, unknown>> = [];
let step_jobs: number[] = [];
let paused: Array<Record<string, unknown>> = [];
let pushed: number[] = [];

mock.module("@/src/functions/backend/db/bot-questions/grab-bot-question", () => ({
    default: async () => ({ id: 30, ...question }),
}));
mock.module("@/src/functions/backend/db/bot-sessions/grab-user-bot-session", () => ({
    default: async ({ session_id }: { session_id: number }) => ({
        id: session_id,
        workspace_id: null,
        status: "active",
        ask_id: null,
        hook_id: null,
    }),
}));
mock.module("@/src/functions/backend/db/bot-sessions/ensure-bot-session", () => ({
    default: async () => ({ id: 135, workspace_id: null, status: "active" }),
}));
mock.module("@/src/functions/backend/db/bots/insert-user-message", () => ({
    default: async (params: Record<string, unknown>) => {
        inserted.push(params);
        return { id: 982, ...params };
    },
}));
mock.module("@/src/functions/backend/db/bots-queue/enqueue-bot-reply", () => ({
    default: async (params: Record<string, unknown>) => {
        enqueued.push(params);
    },
}));
mock.module("@/src/bots-queue/push-bot-notice", () => ({
    default: async ({ message }: { message: { id: number } }) => {
        pushed.push(message.id);
    },
}));
mock.module("@/src/functions/backend/db/bot-plans/enqueue-plan-step", () => ({
    default: async ({ plan_id }: { plan_id: number }) => {
        step_jobs.push(plan_id);
        return 900;
    },
}));
mock.module("@/src/functions/backend/db/bot-plans/set-bot-plan-status", () => ({
    default: async (params: Record<string, unknown>) => {
        paused.push(params);
        return { row: { id: params.plan_id }, started: false };
    },
}));
mock.module("@/src/bots-queue/push-bot-plan", () => ({
    default: async () => {},
}));
mock.module("@/src/bots-queue/wake-bots-queue", () => ({
    default: () => {},
}));
mock.module("@/src/functions/backend/logger", () => ({
    logError: async () => {},
}));

const { default: postBotQuestionAnswers } = await import("./post-bot-question-answers");

afterAll(() => {
    mock.restore();
});

const view = {
    id: 30,
    status: "answered",
    questions: [{ question: "Which mailbox?", kind: "single", options: ["Work", "Personal"], allow_other: false }],
    answers: [{ choices: [0], other: "" }],
} as unknown as BotQuestionView;

beforeEach(() => {
    question = { bot_id: 1, session_id: 135, workspace_id: null, plan_mode: 0, plan_id: null };
    inserted = [];
    enqueued = [];
    step_jobs = [];
    paused = [];
    pushed = [];
});

describe("postBotQuestionAnswers", () => {
    test("runs the answer in Plan mode when the question was asked in it", async () => {
        question.plan_mode = 1;

        await postBotQuestionAnswers({ view, user_id: 1 });

        expect(inserted).toHaveLength(1);
        expect(inserted[0]!.plan_mode).toBe(true);
        expect(enqueued).toHaveLength(1);
        expect(enqueued[0]!.params).toEqual({ plan_mode: true });
        expect(pushed).toEqual([982]);
    });

    test("runs an ordinary answer as an ordinary reply", async () => {
        await postBotQuestionAnswers({ view, user_id: 1 });

        expect(inserted[0]!.plan_mode).toBe(false);
        expect(enqueued[0]!.params).toBeUndefined();
    });

    test("a plan's card answered Continue starts the next step, with no other reply", async () => {
        question.plan_id = 3;

        await postBotQuestionAnswers({ view, user_id: 1 });

        expect(step_jobs).toEqual([3]);
        expect(enqueued).toHaveLength(0);
        expect(paused).toHaveLength(0);
    });

    test("any other answer to a plan's card leaves the plan where it stands and lets the reply decide", async () => {
        question.plan_id = 3;

        await postBotQuestionAnswers({
            view: { ...view, answers: [{ choices: [1], other: "" }] } as unknown as BotQuestionView,
            user_id: 1,
        });

        expect(paused).toHaveLength(0);
        expect(step_jobs).toEqual([]);
        expect(enqueued).toHaveLength(1);
    });

    test("a skipped plan card holds the plan rather than moving it on", async () => {
        question.plan_id = 3;

        await postBotQuestionAnswers({
            view: { ...view, status: "skipped" } as unknown as BotQuestionView,
            user_id: 1,
        });

        expect(step_jobs).toEqual([]);
        expect(paused).toHaveLength(0);
        expect(enqueued).toHaveLength(1);
    });
});