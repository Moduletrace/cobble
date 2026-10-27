import { describe, expect, test } from "bun:test";
import type { ChatroomSummary } from "@/src/types";
import mergeChatroom from "./merge-chatroom";

const room = (id: number, status: ChatroomSummary["status"], at: number): ChatroomSummary => ({
    id,
    status,
    last_activity_at: at,
    bots: [],
});

describe("mergeChatroom", () => {
    test("replaces a room it has and keeps open rooms first, latest next", () => {
        const merged = mergeChatroom({
            chatrooms: [room(1, "open", 10), room(2, "answered", 30)],
            chatroom: room(1, "answered", 40),
        });

        expect(merged.map((r) => r.id)).toEqual([1, 2]);
        expect(merged[0]?.status).toBe("answered");
    });

    test("adds a new room", () => {
        const merged = mergeChatroom({
            chatrooms: [room(2, "answered", 30)],
            chatroom: room(3, "open", 5),
        });

        expect(merged.map((r) => r.id)).toEqual([3, 2]);
    });
});
