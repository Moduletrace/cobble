import { describe, expect, test } from "bun:test";
import { closingNoTextNote, replyDraftNote, replyNoTextNote } from "@/src/data/harness-prompts";
import unsentAnswerMessage from "./unsent-answer-message";

/**
 * The notice a failed run leaves, kept to what actually happened: an empty
 * send_reply used to read as an answer the app caught lying.
 */
describe("unsentAnswerMessage", () => {
    test("an empty send_reply says the reply had no message", () => {
        expect(unsentAnswerMessage({ note: replyNoTextNote })).toBe(`The reply ended without a message, so it wasn't sent.`);
    });

    test("a card with no message says so", () => {
        expect(unsentAnswerMessage({ note: closingNoTextNote })).toBe(
            `The reply ended with a card and no message, so it wasn't sent.`,
        );
    });

    test("a draft says the reply was never sent as a message", () => {
        expect(unsentAnswerMessage({ note: replyDraftNote })).toBe(
            `The reply ended as a draft instead of a sent message, so it wasn't sent.`,
        );
    });

    test("a check against the record keeps saying so", () => {
        expect(unsentAnswerMessage({ note: "It names task #16, and no such task exists." })).toBe(
            `The answer didn't hold up against the app's record, so it wasn't sent.`,
        );
    });
});