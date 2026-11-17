import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";

/**
 * `update_requester` lets a bot answering a crew request send the asking bot
 * an interim word without ending the run or the request. It resolves the
 * request (by the job's ask_id, else by the session), refuses once the
 * request has ended, caps how many a run may send, and strips question refs
 * (a question stays in the conversation it was asked in).
 */
let ask: BUN_SQLITE_COBBLE_BOT_ASKS | null;
let by_session: BUN_SQLITE_COBBLE_BOT_ASKS | null;
let told: Array<{ text: string }> = [];
let sent_ids: number[] = [];
const signal = new AbortController().signal;

mock.module("@/src/functions/backend/db/asks/grab-ask", () => ({
    default: async () => ask,
}));
mock.module("@/src/functions/backend/db/asks/grab-open-ask-by-session", () => ({
    default: async () => by_session,
}));
mock.module("@/src/functions/backend/db/asks/tell-ask-requester", () => ({
    default: async ({ text }: { text: string }) => {
        told.push({ text });
        return { session_id: 56, message: { id: 900 + told.length } };
    },
}));

const updateRequesterTool = (await import("./update-requester-tool")).default;

afterAll(() => {
    mock.restore();
});

beforeEach(() => {
    ask = { id: 3, status: "working", title: "Build the graphic", target_bot_id: 3 } as BUN_SQLITE_COBBLE_BOT_ASKS;
    by_session = null;
    told = [];
    sent_ids = [];
});

describe("updateRequesterTool", () => {
    test("sends an update on the request the job carries, marked still open", async () => {
        const tool = updateRequesterTool({ user_id: 1, session_id: 67, ask_id: 3, onSend: ({ message_id }) => sent_ids.push(message_id) });

        const answer = await tool.run({ args: { text: "The key is rendered; composing the layout now." }, signal });

        expect(told.length).toBe(1);
        expect(told[0]?.text).toContain("The key is rendered; composing the layout now.");
        expect(told[0]?.text).toContain("still open");
        expect(sent_ids).toEqual([901]);
        expect(String(answer)).toContain("Sent to the bot that asked");
    });

    test("resolves the request by the session when the job carries no ask_id", async () => {
        by_session = { id: 3, status: "working", title: "Build the graphic", target_bot_id: 3 } as BUN_SQLITE_COBBLE_BOT_ASKS;
        const tool = updateRequesterTool({ user_id: 1, session_id: 67 });

        await tool.run({ args: { text: "Halfway there." }, signal });

        expect(told.length).toBe(1);
    });

    test("refuses once the request has ended", async () => {
        ask = { id: 3, status: "answered" } as BUN_SQLITE_COBBLE_BOT_ASKS;
        const tool = updateRequesterTool({ user_id: 1, session_id: 67, ask_id: 3 });

        await expect(tool.run({ args: { text: "One more thing." }, signal })).rejects.toThrow("This request has already ended");
        expect(told).toEqual([]);
    });

    test("refuses when there is no request to update", async () => {
        ask = null;
        const tool = updateRequesterTool({ user_id: 1, session_id: 67, ask_id: 3 });

        await expect(tool.run({ args: { text: "Hello?" }, signal })).rejects.toThrow("This request has already ended");
    });

    test("strips a question ref out of the update", async () => {
        const tool = updateRequesterTool({ user_id: 1, session_id: 67, ask_id: 3 });

        await tool.run({ args: { text: "Pick a colour [question:60]." }, signal });

        expect(told[0]?.text).not.toContain("[question:60]");
    });

    test("caps the updates a single run may send", async () => {
        const tool = updateRequesterTool({ user_id: 1, session_id: 67, ask_id: 3 });

        for (let i = 0; i < AppData.BotReplyInterimMessagesMax; i++) {
            await tool.run({ args: { text: `Update ${i}` }, signal });
        }

        await expect(tool.run({ args: { text: "One too many" }, signal })).rejects.toThrow("updates on this request already");
        expect(told.length).toBe(AppData.BotReplyInterimMessagesMax);
    });

    test("takes a short non-empty update", () => {
        const tool = updateRequesterTool({ user_id: 1, session_id: 67, ask_id: 3 });

        expect(tool.schema?.safeParse({ text: "A heads-up." }).success).toBe(true);
        expect(tool.schema?.safeParse({ text: "   " }).success).toBe(false);
        expect(tool.schema?.safeParse({ text: "x".repeat(2001) }).success).toBe(false);
    });
});
