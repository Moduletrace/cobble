import { describe, expect, test } from "bun:test";
import chatroomOutcomeMessage from "./chatroom-outcome-message";

describe("chatroomOutcomeMessage", () => {
    test("an answer names the request, links the room and carries the answer", () => {
        expect(chatroomOutcomeMessage({ chatroom_id: 4, title: "Specs", status: "answered", outcome: "Here." })).toBe(
            `The coordinator answered your request "Specs" ([room:4]):\n\nHere.`,
        );
    });

    test("a refusal and a failure say why", () => {
        expect(chatroomOutcomeMessage({ chatroom_id: 4, title: "Specs", status: "refused", outcome: "No one has them." })).toContain(
            "turned down",
        );
        expect(chatroomOutcomeMessage({ chatroom_id: 4, title: "Specs", status: "failed", outcome: "Out of turns." })).toBe(
            `Your request "Specs" ([room:4]) couldn't be answered:\n\nOut of turns.`,
        );
    });

    test("a stopped room only says so", () => {
        expect(chatroomOutcomeMessage({ chatroom_id: 4, title: "Specs", status: "stopped", outcome: "ignored" })).toBe(
            `Your request "Specs" ([room:4]) was stopped by the user.`,
        );
    });
});
