import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

const queued: Array<Record<string, unknown>> = [];
const open_work_calls: Array<{
    bot_id?: number | string;
    session_id?: number | string;
    exclude_job_id?: number | string;
}> = [];
let open_work = false;
let next_job_id = 100;
let ahead = 0;

/**
 * The real `queueBotTask` runs, so its guards stay in the picture; only
 * what it reads and writes is mocked. Mocking it whole polluted a sibling
 * suite that exercises the same helper through `start_task`.
 */
mock.module("@/src/functions/backend/db/bots-queue/enqueue-bot-job", () => ({
    default: async (params: Record<string, unknown>) => {
        queued.push(params);
        return next_job_id++;
    },
}));
mock.module("@/src/functions/backend/db/bots-queue/grab-open-bot-task", () => ({
    default: async () => null,
}));
mock.module("@/src/functions/backend/db/asks/grab-open-ask-by-session", () => ({
    default: async () => null,
}));
mock.module("@/src/functions/backend/db/bots-queue/has-open-work", () => ({
    default: async (params: { bot_id?: number | string; session_id?: number | string; exclude_job_id?: number | string }) => {
        open_work_calls.push(params);
        return open_work;
    },
}));

const { default: sendReplyTool } = await import("./send-reply-tool");

afterAll(() => {
    mock.restore();
});

const signal = new AbortController().signal;
const tool = (overrides: Partial<Parameters<typeof sendReplyTool>[0]> = {}) =>
    sendReplyTool({
        user_id: 1,
        bot_id: 5,
        session_id: 9,
        computers: [],
        job_id: 55,
        ...overrides,
    });

beforeEach(() => {
    queued.length = 0;
    open_work_calls.length = 0;
    open_work = false;
    next_job_id = 100;
    ahead = 0;
});

describe("sendReplyTool", () => {
    test("status working with work queues the run and says the message goes out with it", async () => {
        const queued_jobs: number[] = [];
        const reply = sendReplyTool({
            user_id: 1,
            bot_id: 5,
            session_id: 9,
            computers: [],
            job_id: 55,
            onQueue: ({ job_id }) => queued_jobs.push(job_id),
        });

        const result = await reply.run({
            args: { status: "working", work: { title: "Check the logs", instructions: "Read them." } },
            signal,
        });

        expect(queued).toHaveLength(1);
        expect(queued[0]!.title).toBe("Check the logs");
        expect(queued[0]!.bot_id).toBe(5);
        expect(queued_jobs).toEqual([100]);
        expect(result).toContain("Run #100 queued");
        expect(result).toContain("Your message beside this call goes out with it");
    });

    test("queues the work once even if the call runs again", async () => {
        const reply = tool();
        const args = {
            status: "working" as const,
            work: { title: "Check the logs", instructions: "Read them." },
        };

        const first = await reply.run({ args, signal });
        const second = await reply.run({ args, signal });

        expect(queued).toHaveLength(1);
        expect(first).toBe(second);
    });

    test("status working without work or an open run refuses without sending", async () => {
        await expect(tool().run({ args: { status: "working" }, signal })).rejects.toThrow(
            "Nothing of yours is running in this conversation",
        );
        await expect(tool().run({ args: { status: "working" }, signal })).rejects.toThrow("Nothing was sent.");
        expect(open_work_calls).toEqual([
            { bot_id: 5, session_id: 9, exclude_job_id: 55 },
            { bot_id: 5, session_id: 9, exclude_job_id: 55 },
        ]);
    });

    test("status working without work holds when a run is already open", async () => {
        open_work = true;

        const result = await tool().run({ args: { status: "working" }, signal });

        expect(result).toContain("A run of yours is still open here");
        expect(open_work_calls[0]!.exclude_job_id).toBe(55);
    });

    test("work cannot ride with status done or blocked", async () => {
        await expect(
            tool().run({ args: { status: "done", work: { title: "x", instructions: "y" } }, signal }),
        ).rejects.toThrow(`work can only be passed with status "working"`);
        await expect(
            tool().run({ args: { status: "blocked", work: { title: "x", instructions: "y" } }, signal }),
        ).rejects.toThrow(`work can only be passed with status "working"`);
        expect(queued).toHaveLength(0);
    });

    test("done sends the message and implies nothing runs", async () => {
        const result = await tool().run({ args: { status: "done" }, signal });

        expect(result).toContain("marked done");
        expect(result).toContain("Nothing runs after it");
        expect(queued).toHaveLength(0);
    });

    test("blocked sends the message and asks what is needed", async () => {
        const result = await tool().run({ args: { status: "blocked" }, signal });

        expect(result).toContain("marked blocked");
        expect(result).toContain("what stopped the work");
        expect(queued).toHaveLength(0);
    });

    test("accepts text and message in arguments and defaults status to done", async () => {
        const result = await tool().run({ args: { message: "Here is your skill." }, signal });

        expect(result).toContain("marked done");
        expect(queued).toHaveLength(0);
    });

    test("infers status working when work is passed without status", async () => {
        const result = await tool().run({
            args: { work: { title: "Look up files", instructions: "Inspect them." } },
            signal,
        });

        expect(result).toContain("Run #100 queued");
        expect(queued).toHaveLength(1);
    });

    describe("in Plan mode", () => {
        test("refuses work before it can queue anything", async () => {
            await expect(
                tool({ plan_mode: true }).run({
                    args: { status: "working", work: { title: "Check the logs", instructions: "Read them." } },
                    signal,
                }),
            ).rejects.toThrow("Plan mode is on for this reply");
            expect(queued).toHaveLength(0);
        });

        test("refuses status working even when a run is already open", async () => {
            open_work = true;

            await expect(
                tool({ plan_mode: true }).run({ args: { status: "working" }, signal }),
            ).rejects.toThrow("Plan mode is on for this reply");

            expect(open_work_calls).toEqual([]);
            expect(queued).toHaveLength(0);
        });

        test("leaves work out of the arguments the model is offered", () => {
            const schema = tool({ plan_mode: true }).schema!;

            expect(schema.parse({ status: "done", work: { title: "x", instructions: "y" }, message: "A plan." })).toEqual({
                status: "done",
                message: "A plan.",
            });
            expect(schema.safeParse({ status: "working" }).success).toBe(false);
        });

        test("still sends the plan as the answer", async () => {
            const result = await tool({ plan_mode: true }).run({ args: { status: "done", message: "Here is the plan." }, signal });

            expect(result).toContain("marked done");
            expect(queued).toHaveLength(0);
        });

        test("says in its description that it plans and reads", () => {
            expect(tool({ plan_mode: true }).description).toContain("Plan mode is on");
            expect(tool().description).not.toContain("Plan mode is on");
        });
    });
});