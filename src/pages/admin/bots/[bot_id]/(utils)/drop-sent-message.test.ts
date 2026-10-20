import { describe, expect, test } from "bun:test";
import type { BotMessageWithAttachments } from "@/src/types";
import dropSentMessage from "./drop-sent-message";

const pendingMessage = (overrides: Partial<BotMessageWithAttachments> = {}): BotMessageWithAttachments => ({
    id: -1,
    author: "user",
    text: "Hello",
    ...overrides,
});

const savedMessage = (overrides: Partial<BotMessageWithAttachments> = {}): BotMessageWithAttachments => ({
    id: 7,
    author: "user",
    text: "Hello",
    ...overrides,
});

describe("dropSentMessage", () => {
    test("drops the pending copy the saved message replaces", () => {
        const other = pendingMessage({ id: -2, text: "Later" });

        expect(
            dropSentMessage({ pending: [pendingMessage(), other], message: savedMessage() }),
        ).toEqual([other]);
    });

    test("leaves the thread alone when nothing matches", () => {
        const pending = [pendingMessage({ text: "Something else" })];

        expect(dropSentMessage({ pending, message: savedMessage() })).toBe(pending);
    });

    test("matches on the quote as well as the text", () => {
        const pending = [pendingMessage({ reply_to: { id: 3, author: "bot", text: "Hi" } })];

        expect(dropSentMessage({ pending, message: savedMessage({ reply_to_message_id: 3 }) })).toEqual([]);
        expect(
            dropSentMessage({ pending, message: savedMessage({ reply_to_message_id: 4 }) }),
        ).toBe(pending);
    });

    test("only drops one copy of the same words", () => {
        const pending = [pendingMessage({ id: -1 }), pendingMessage({ id: -2 })];

        expect(dropSentMessage({ pending, message: savedMessage() })).toEqual([pendingMessage({ id: -2 })]);
    });

    test("never drops a bot message", () => {
        const pending = [pendingMessage()];
        const message = savedMessage({ author: "bot" });

        expect(dropSentMessage({ pending, message })).toBe(pending);
    });
});
