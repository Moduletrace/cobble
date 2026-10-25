import { describe, expect, test } from "bun:test";
import hasUnansweredMessage from "./has-unanswered-message";

const user = (id: number) => ({ id, author: "user" as const });
const bot = (id: number) => ({ id, author: "bot" as const });

describe("hasUnansweredMessage", () => {
    test("a message sent while the last reply ran is answered, though the thread ends with the bot", () => {
        /**
         * A (10) was being answered when B (11) came in; the reply (12)
         * was saved after B but its run never read it.
         */
        expect(hasUnansweredMessage({ history: [user(10), user(11), bot(12)], answered_id: 10 })).toBe(true);
    });

    test("a message the last reply took in is not answered twice", () => {
        expect(hasUnansweredMessage({ history: [user(10), user(11), bot(12)], answered_id: 11 })).toBe(false);
    });

    test("a burst after the answer is answered", () => {
        expect(
            hasUnansweredMessage({ history: [user(10), bot(12), user(13), user(14)], answered_id: 10 }),
        ).toBe(true);
    });

    test("without a record, the user having the last word decides", () => {
        expect(hasUnansweredMessage({ history: [user(1)], answered_id: null })).toBe(true);
        expect(hasUnansweredMessage({ history: [user(1), bot(2)], answered_id: null })).toBe(false);
    });

    test("nothing from the user, nothing to answer", () => {
        expect(hasUnansweredMessage({ history: [], answered_id: null })).toBe(false);
        expect(hasUnansweredMessage({ history: [bot(4)], answered_id: 2 })).toBe(false);
    });
});
