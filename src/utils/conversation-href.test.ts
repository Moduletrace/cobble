import { describe, expect, test } from "bun:test";
import conversationHref from "./conversation-href";

describe("conversationHref", () => {
    test("the bot's own chat, on its active session", () => {
        expect(conversationHref({ bot_id: 3 })).toBe("/admin/bots/3");
    });

    test("a workspace's conversation, on a given session", () => {
        expect(conversationHref({ bot_id: 3, workspace_id: 4, session_id: 7 })).toBe(
            "/admin/workspaces/4/bots/3?session_id=7",
        );
    });
});
