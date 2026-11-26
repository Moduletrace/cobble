import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOT_ASKS, BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import type { HarnessToolUse } from "@/src/harness/types";

/**
 * The crew request lifecycle as the runs working it end. The production
 * fault this pins: an answer that acknowledges the brief and kicks off a
 * `start_task` used to be taken as the whole answer (and faulted for saying
 * the work was under way), so the asking bot was told "it ended without
 * answering" while the real render was still running and its result never
 * came back. Now the request stays open while work is open, each result is
 * relayed as it lands, and the last one ends it.
 *
 * The side-effect helpers are mocked; the claim/exemption utilities run for
 * real so the branching is tested against the same rules the reply review
 * uses.
 */
let ask: BUN_SQLITE_COBBLE_BOT_ASKS;
let open_work: boolean;
let reopened: BUN_SQLITE_COBBLE_BOT_ASKS | null;
let finished: Array<{ status: string; outcome?: string | null }> = [];
let told: Array<{ text: string }> = [];
let shared: string[] = [];
let deleted_sessions: Array<number | string> = [];

mock.module("@/src/functions/backend/db/asks/grab-ask", () => ({
    default: async () => ask,
}));
mock.module("@/src/functions/backend/db/bots-queue/has-open-work", () => ({
    default: async () => open_work,
}));
mock.module("@/src/functions/backend/db/asks/share-ask-files", () => ({
    default: async ({ answer }: { answer: string }) => {
        shared.push(answer);
        return answer;
    },
}));
mock.module("@/src/functions/backend/db/asks/finish-ask", () => ({
    default: async ({ status, outcome }: { status: string; outcome?: string | null }) => {
        finished.push({ status, outcome });
        return ask;
    },
}));
mock.module("@/src/functions/backend/db/asks/reopen-failed-ask", () => ({
    default: async () => reopened,
}));
mock.module("@/src/functions/backend/db/asks/tell-ask-requester", () => ({
    default: async ({ text }: { text: string }) => {
        told.push({ text });
        return { session_id: 56, message: { id: 900 } };
    },
}));
mock.module("@/src/functions/backend/db/bot-sessions/delete-empty-ask-session", () => ({
    default: async ({ session_id }: { session_id: number | string }) => {
        deleted_sessions.push(session_id);
    },
}));

const onAskJobEnded = (await import("./on-ask-job-ended")).default;

afterAll(() => {
    mock.restore();
});

/** The request as production ask #3: bot 5 asked bot 3, answered in session 67. */
function workingAsk(): BUN_SQLITE_COBBLE_BOT_ASKS {
    return {
        id: 3,
        status: "working",
        session_id: 67,
        job_id: 491,
        target_bot_id: 3,
        requester_bot_id: 5,
        user_id: 1,
        workspace_id: 2,
        origin_session_id: 56,
        title: "Build the preapproval graphic",
    } as BUN_SQLITE_COBBLE_BOT_ASKS;
}

/** The asked bot's first answer reply (stage=answer). */
function answerJob(): BUN_SQLITE_COBBLE_BOTS_QUEUE {
    return { id: 491, bot_id: 3, session_id: 67, params: `{"ask_id":3,"stage":"answer"}` } as BUN_SQLITE_COBBLE_BOTS_QUEUE;
}

/** A run the answer handed the work to (start_task), carrying the ask_id. */
function childJob(): BUN_SQLITE_COBBLE_BOTS_QUEUE {
    return { id: 492, bot_id: 3, session_id: 67, params: `{"ask_id":3}` } as BUN_SQLITE_COBBLE_BOTS_QUEUE;
}

const started_task: HarnessToolUse[] = [{ name: "start_task", ok: true } as HarnessToolUse];
const claim = "Taking it on. I'll report back when the render is done.";
const real_answer = "Done. The post is built and saved: [file:650].";

beforeEach(() => {
    ask = workingAsk();
    open_work = false;
    reopened = null;
    finished = [];
    told = [];
    shared = [];
    deleted_sessions = [];
});

describe("onAskJobEnded - the answer reply", () => {
    test("an answer that started work still running keeps the request open and relays the ack as an update", async () => {
        open_work = true;

        await onAskJobEnded({ job: answerJob(), text: claim, tool_uses: started_task });

        expect(finished).toEqual([]);
        expect(told.length).toBe(1);
        expect(told[0]?.text).toContain(claim);
        expect(told[0]?.text).toContain("still open");
    });

    test("a failed answer with work open relays nothing", async () => {
        open_work = true;

        await onAskJobEnded({ job: answerJob(), text: "The model call died.", failed: true });

        expect(finished).toEqual([]);
        expect(told).toEqual([]);
    });

    test("an answer that only promises work, starting none, fails the request", async () => {
        await onAskJobEnded({ job: answerJob(), text: claim, tool_uses: [] });

        expect(finished).toEqual([{ status: "failed", outcome: "It ended without answering: it only said the work was under way." }]);
    });

    test("an answer that really called start_task isn't faulted for saying the work is under way", async () => {
        await onAskJobEnded({ job: answerJob(), text: claim, tool_uses: started_task });

        expect(finished).toEqual([{ status: "answered", outcome: claim }]);
    });

    test("an answer that tried start_task and was refused isn't faulted either", async () => {
        await onAskJobEnded({ job: answerJob(), text: claim, tool_uses: [{ name: "start_task", ok: false } as HarnessToolUse] });

        expect(finished).toEqual([{ status: "answered", outcome: claim }]);
    });

    test("a direct answer ends the request answered", async () => {
        await onAskJobEnded({ job: answerJob(), text: real_answer, tool_uses: [] });

        expect(finished).toEqual([{ status: "answered", outcome: real_answer }]);
        expect(shared).toEqual([real_answer]);
    });

    test("a failed answer fails the request", async () => {
        await onAskJobEnded({ job: answerJob(), text: "", failed: true });

        expect(finished[0]?.status).toBe("failed");
    });

    test("an empty answer fails the request", async () => {
        await onAskJobEnded({ job: answerJob(), text: "   ", tool_uses: [] });

        expect(finished).toEqual([{ status: "failed", outcome: "The bot it was passed to ended without an answer." }]);
    });

    test("a late job that isn't the one answering says nothing", async () => {
        ask = { ...workingAsk(), job_id: 999 } as BUN_SQLITE_COBBLE_BOT_ASKS;

        await onAskJobEnded({ job: answerJob(), text: real_answer });

        expect(finished).toEqual([]);
    });
});

describe("onAskJobEnded - a run the answer handed the work to", () => {
    test("a result while more work is open is relayed as an update and keeps the request open", async () => {
        open_work = true;

        await onAskJobEnded({ job: childJob(), text: real_answer });

        expect(finished).toEqual([]);
        expect(told.length).toBe(1);
        expect(told[0]?.text).toContain(real_answer);
        expect(told[0]?.text).toContain("still open");
    });

    test("the last result ends the request answered", async () => {
        await onAskJobEnded({ job: childJob(), text: real_answer });

        expect(told).toEqual([]);
        expect(finished).toEqual([{ status: "answered", outcome: real_answer }]);
    });

    test("a failed last run fails the request with what it said", async () => {
        await onAskJobEnded({ job: childJob(), text: "The render crashed.", failed: true });

        expect(finished).toEqual([{ status: "failed", outcome: "The render crashed." }]);
    });

    test("an empty last result fails the request", async () => {
        await onAskJobEnded({ job: childJob(), text: "" });

        expect(finished).toEqual([{ status: "failed", outcome: "The bot it was passed to ended without an answer." }]);
    });

    test("an empty result while work is still open relays nothing", async () => {
        open_work = true;

        await onAskJobEnded({ job: childJob(), text: "" });

        expect(finished).toEqual([]);
        expect(told).toEqual([]);
    });

    test("a failed update while work is open is relayed as a failed piece", async () => {
        open_work = true;

        await onAskJobEnded({ job: childJob(), text: "One pass crashed.", failed: true });

        expect(finished).toEqual([]);
        expect(told[0]?.text).toContain("couldn't finish one piece");
    });
});

describe("onAskJobEnded - a result landing after the request already failed", () => {
    test("a late child result is delivered and the request reads answered", async () => {
        ask = { ...workingAsk(), status: "failed" } as BUN_SQLITE_COBBLE_BOT_ASKS;
        reopened = ask;

        await onAskJobEnded({ job: childJob(), text: real_answer });

        expect(finished).toEqual([]);
        expect(shared).toEqual([real_answer]);
        expect(told.length).toBe(1);
        expect(told[0]?.text).toContain("which answered");
        expect(told[0]?.text).toContain(real_answer);
    });

    test("a late failure changes nothing", async () => {
        ask = { ...workingAsk(), status: "failed" } as BUN_SQLITE_COBBLE_BOT_ASKS;

        await onAskJobEnded({ job: childJob(), text: "", failed: true });

        expect(finished).toEqual([]);
        expect(told).toEqual([]);
    });

    test("a request someone else re-ended first is not written twice", async () => {
        ask = { ...workingAsk(), status: "failed" } as BUN_SQLITE_COBBLE_BOT_ASKS;
        reopened = null;

        await onAskJobEnded({ job: childJob(), text: real_answer });

        expect(finished).toEqual([]);
        expect(told).toEqual([]);
    });

    test("a stopped request is not reopened", async () => {
        ask = { ...workingAsk(), status: "stopped" } as BUN_SQLITE_COBBLE_BOT_ASKS;

        await onAskJobEnded({ job: childJob(), text: real_answer });

        expect(finished).toEqual([]);
        expect(told).toEqual([]);
    });
});

describe("onAskJobEnded - the gate's review and guards", () => {
    test("a failed review fails the request and clears its hidden session", async () => {
        const review_job = { id: 490, bot_id: 1, session_id: 66, params: `{"ask_id":3,"stage":"review"}` } as BUN_SQLITE_COBBLE_BOTS_QUEUE;

        await onAskJobEnded({ job: review_job, text: "", failed: true });

        expect(deleted_sessions).toEqual([66]);
        expect(finished[0]?.status).toBe("failed");
    });

    test("a finished review applied its decision itself", async () => {
        const review_job = { id: 490, bot_id: 1, session_id: 66, params: `{"ask_id":3,"stage":"review"}` } as BUN_SQLITE_COBBLE_BOTS_QUEUE;

        await onAskJobEnded({ job: review_job, text: "" });

        expect(deleted_sessions).toEqual([66]);
        expect(finished).toEqual([]);
    });

    test("a job with no ask_id is none of the request's business", async () => {
        const plain = { id: 500, bot_id: 3, session_id: 67, params: `{}` } as BUN_SQLITE_COBBLE_BOTS_QUEUE;

        await onAskJobEnded({ job: plain, text: real_answer });

        expect(finished).toEqual([]);
        expect(told).toEqual([]);
    });

    test("an already-ended request isn't touched again", async () => {
        ask = { ...workingAsk(), status: "answered" } as BUN_SQLITE_COBBLE_BOT_ASKS;

        await onAskJobEnded({ job: childJob(), text: real_answer });

        expect(finished).toEqual([]);
        expect(told).toEqual([]);
    });
});
