import { describe, expect, test } from "bun:test";
import chatroomStatusLine from "./chatroom-status-line";

describe("chatroomStatusLine", () => {
    test("an open room says whether a bot is at work in it", () => {
        expect(chatroomStatusLine({ status: "open", working: true })).toBe("Working on it");
        expect(chatroomStatusLine({ status: "open", working: false })).toBe("Waiting");
    });

    test("a closed room says how it ended", () => {
        expect(chatroomStatusLine({ status: "answered" })).toBe("Answered");
        expect(chatroomStatusLine({ status: "refused" })).toBe("Turned down");
        expect(chatroomStatusLine({ status: "failed" })).toBe("Couldn't be answered");
        expect(chatroomStatusLine({ status: "stopped" })).toBe("Stopped");
    });
});
