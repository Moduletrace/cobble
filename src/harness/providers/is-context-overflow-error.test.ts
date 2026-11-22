import { describe, expect, test } from "bun:test";
import isContextOverflowError from "./is-context-overflow-error";

describe("isContextOverflowError", () => {
    test.each([
        "This model's maximum context length is 131072 tokens",
        "context_length_exceeded",
        "The prompt is too long for this model",
        "Please reduce the length of the messages",
        "input length and max_tokens exceed the model's context",
        "This request exceeds the maximum number of tokens",
        "Your request is 200000 tokens which exceeds the maximum",
    ])("reads %p as a window the prompt went past", (detail) => {
        expect(isContextOverflowError({ status: 400, detail })).toBe(true);
    });

    test("a plain 400 about something else is not a context overflow", () => {
        expect(isContextOverflowError({ status: 400, detail: "Invalid `temperature`: must be between 0 and 2" })).toBe(
            false,
        );
    });

    test("a server error or a rate limit is never read as one, whatever it says", () => {
        expect(isContextOverflowError({ status: 500, detail: "maximum context length" })).toBe(false);
        expect(isContextOverflowError({ status: 429, detail: "context length exceeded" })).toBe(false);
    });

    test("an empty detail is not one", () => {
        expect(isContextOverflowError({ status: 400 })).toBe(false);
        expect(isContextOverflowError({ status: 400, detail: "" })).toBe(false);
    });
});
