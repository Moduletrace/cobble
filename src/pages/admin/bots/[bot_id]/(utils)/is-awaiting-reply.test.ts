import { describe, expect, test } from "bun:test";
import isAwaitingReply from "./is-awaiting-reply";

describe("isAwaitingReply", () => {
    test("the user having the last word owes a reply", () => {
        expect(isAwaitingReply({ last_message: { author: "user" }, face: "idle" })).toBe(true);
    });

    test("an acknowledgement sent mid-reply keeps it due while the bot works", () => {
        expect(isAwaitingReply({ last_message: { author: "bot", interim: 1 }, face: "working" })).toBe(
            true,
        );
    });

    test("once the reply is over, an acknowledgement left last owes nothing", () => {
        expect(isAwaitingReply({ last_message: { author: "bot", interim: 1 }, face: "idle" })).toBe(false);
    });

    test("an answer owes nothing, even while the bot works elsewhere", () => {
        expect(isAwaitingReply({ last_message: { author: "bot", interim: 0 }, face: "working" })).toBe(
            false,
        );
        expect(isAwaitingReply({ last_message: { author: "bot" }, face: "working" })).toBe(false);
    });

    test("an empty thread owes nothing", () => {
        expect(isAwaitingReply({ last_message: null, face: "working" })).toBe(false);
    });
});
