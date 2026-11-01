import { describe, expect, test } from "bun:test";
import chatroomHoldsReply from "@/src/pages/admin/bots/[bot_id]/(utils)/chatroom-holds-reply";
import canRetryChatroom from "./can-retry-chatroom";
import chatroomInConversation from "./chatroom-in-conversation";
import chatroomRetryNote from "./chatroom-retry-note";

describe("canRetryChatroom", () => {
    test("only failed and stopped rooms", () => {
        expect(canRetryChatroom({ chatroom: { status: "failed" } })).toBe(true);
        expect(canRetryChatroom({ chatroom: { status: "stopped" } })).toBe(true);

        for (const status of ["open", "answered", "refused"] as const) {
            expect(canRetryChatroom({ chatroom: { status } })).toBe(false);
        }
    });
});

describe("chatroomRetryNote", () => {
    test("keeps how a failed try ended", () => {
        expect(chatroomRetryNote({ chatroom: { status: "failed", outcome: "No model." } })).toContain("No model.");
    });

    test("says a stopped try was stopped", () => {
        expect(chatroomRetryNote({ chatroom: { status: "stopped", outcome: "" } })).toContain("stopped");
    });
});

describe("chatroomInConversation", () => {
    const base = { requester_bot_id: 3, workspace_id: 7, parent_chatroom_id: undefined };

    test("matches the asking bot in its place", () => {
        expect(chatroomInConversation({ chatroom: base, bot_id: 3, workspace_id: 7 })).toBe(true);
    });

    test("leaves out other bots, other places and nested rooms", () => {
        expect(chatroomInConversation({ chatroom: base, bot_id: 4, workspace_id: 7 })).toBe(false);
        expect(chatroomInConversation({ chatroom: base, bot_id: 3, workspace_id: null })).toBe(false);
        expect(
            chatroomInConversation({ chatroom: { ...base, parent_chatroom_id: 1 }, bot_id: 3, workspace_id: 7 }),
        ).toBe(false);
    });
});

describe("chatroomHoldsReply", () => {
    const last_message = { from_chatroom_id: 5 };

    test("a stopped room or one running again holds the reply", () => {
        expect(chatroomHoldsReply({ last_message, chatrooms: [{ id: 5, status: "stopped" }] })).toBe(true);
        expect(chatroomHoldsReply({ last_message, chatrooms: [{ id: 5, status: "open" }] })).toBe(true);
    });

    test("a failed room wakes the bot, and other messages don't count", () => {
        expect(chatroomHoldsReply({ last_message, chatrooms: [{ id: 5, status: "failed" }] })).toBe(false);
        expect(chatroomHoldsReply({ last_message: {}, chatrooms: [{ id: 5, status: "stopped" }] })).toBe(false);
    });
});
