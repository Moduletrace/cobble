import { describe, expect, mock, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";

/**
 * `answer_requester` closes the gap where a request's answer session is
 * resumed after the request ended: the finished or corrected answer goes
 * straight back to the bot that asked, on the ended request's own record,
 * instead of a fresh `ask_bot` the gate reads as a new handoff. It shares
 * the answer's files, strips question refs, refuses while the request is
 * still open (the machinery relays that itself), and only for the bot the
 * request was passed to.
 */
let ask: BUN_SQLITE_COBBLE_BOT_ASKS | null;
let shared: string[] = [];
let told: Array<{ text: string }> = [];
const signal = new AbortController().signal;

mock.module("@/src/functions/backend/db/asks/grab-ask", () => ({
    default: async () => ask,
}));
mock.module("@/src/functions/backend/db/asks/share-ask-files", () => ({
    default: async ({ answer }: { answer: string }) => {
        shared.push(answer);
        return answer;
    },
}));
mock.module("@/src/functions/backend/db/asks/tell-ask-requester", () => ({
    default: async ({ text }: { text: string }) => {
        told.push({ text });
        return { session_id: 56, message: { id: 900 } };
    },
}));

const answerRequesterTool = (await import("./answer-requester-tool")).default;

const endedAsk = {
    id: 24,
    status: "answered",
    title: "Sample blog post banner",
    target_bot_id: 8,
    requester_bot_id: 6,
} as BUN_SQLITE_COBBLE_BOT_ASKS;

describe("answerRequesterTool", () => {
    test("a late answer goes back on the ended request and wakes the asker", async () => {
        ask = endedAsk;
        shared = [];
        told = [];

        const tool = answerRequesterTool({ user_id: 1, bot_id: 8, ask_id: 24 });
        const res = await tool.run({ args: { text: "Banner finished: [file:389]." }, signal });

        expect(shared).toEqual(["Banner finished: [file:389]."]);
        expect(told.length).toBe(1);
        expect(told[0]?.text).toContain("Banner finished: [file:389].");
        expect(told[0]?.text).toContain("had already ended");
        expect(String(res)).toContain("Sent to the bot that asked");
    });

    test("an open request is refused: its answer goes back on its own", async () => {
        ask = { ...endedAsk, status: "working" };
        told = [];

        const tool = answerRequesterTool({ user_id: 1, bot_id: 8, ask_id: 24 });

        await expect(tool.run({ args: { text: "Here." }, signal })).rejects.toThrow("still open");
        expect(told).toEqual([]);
    });

    test("only the bot the request was passed to can answer it back", async () => {
        ask = endedAsk;
        told = [];

        const tool = answerRequesterTool({ user_id: 1, bot_id: 9, ask_id: 24 });

        await expect(tool.run({ args: { text: "Here." }, signal })).rejects.toThrow("didn't answer that request");
        expect(told).toEqual([]);
    });

    test("a stopped request can still be answered late", async () => {
        ask = { ...endedAsk, status: "stopped" };
        told = [];

        const tool = answerRequesterTool({ user_id: 1, bot_id: 8, ask_id: 24 });
        await tool.run({ args: { text: "Finished after all." }, signal });

        expect(told.length).toBe(1);
    });
});
