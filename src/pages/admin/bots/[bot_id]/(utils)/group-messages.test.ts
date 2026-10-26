import { describe, expect, test } from "bun:test";
import groupMessages from "./group-messages";

const MIN = 60 * 1000;

describe("groupMessages", () => {
    test("groups consecutive messages by author", () => {
        const groups = groupMessages({
            messages: [
                { id: 1, author: "user", text: "a", created_at: 0 },
                { id: 2, author: "bot", text: "b", created_at: MIN },
                { id: 3, author: "bot", text: "c", created_at: 2 * MIN },
                { id: 4, author: "user", text: "d", created_at: 3 * MIN },
            ],
        });

        expect(groups.map((g) => [g.author, g.messages.length])).toEqual([
            ["user", 1],
            ["bot", 2],
            ["user", 1],
        ]);
        expect(groups[1]!.at).toBe(2 * MIN);
    });

    test("splits a long pause from the same author", () => {
        const groups = groupMessages({
            messages: [
                { id: 1, author: "bot", text: "a", created_at: 0 },
                { id: 2, author: "bot", text: "b", created_at: 10 * MIN },
            ],
        });

        expect(groups).toHaveLength(2);
    });

    test("never joins two sessions, and marks where the later one starts", () => {
        const groups = groupMessages({
            messages: [
                { id: 1, session_id: 7, author: "bot", text: "a", created_at: 0 },
                { id: 2, session_id: 8, author: "bot", text: "summary", created_at: MIN },
                { id: 3, session_id: 8, author: "bot", text: "b", created_at: 2 * MIN },
            ],
        });

        expect(groups.map((g) => [g.messages.length, g.starts_session])).toEqual([
            [1, undefined],
            [2, true],
        ]);
    });
});
