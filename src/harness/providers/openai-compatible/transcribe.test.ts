import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";

let payload: unknown = { text: "hello world" };

mock.module("./provider-request", () => ({
    default: async () => ({ json: async () => payload }),
}));

const { default: transcribe } = await import("./transcribe");

const candidate = {
    key: "text:whisper",
    provider: { kind: "custom", base_url: "https://api.example.com", name: "Example" },
    model: { slug: "whisper-1" },
    source: "pinned",
} as unknown as HarnessCandidate;

const audio = { data: new Uint8Array([1, 2, 3]), format: "wav" };
const signal = new AbortController().signal;

afterAll(() => mock.restore());
beforeEach(() => {
    payload = { text: "hello world" };
});

describe("transcribe", () => {
    test("returns the trimmed transcript", async () => {
        payload = { text: "  hello world  " };

        const result = await transcribe({ candidate, audio, signal });

        expect(result.text).toBe("hello world");
    });

    test("an empty transcript is a retryable failure, not a silent reading (L8)", async () => {
        payload = { text: "" };

        await expect(transcribe({ candidate, audio, signal })).rejects.toBeInstanceOf(HarnessError);
        await expect(transcribe({ candidate, audio, signal })).rejects.toMatchObject({
            retryable: true,
        });
    });

    test("a whitespace-only transcript is a retryable failure too (L8)", async () => {
        payload = { text: "   \n " };

        await expect(transcribe({ candidate, audio, signal })).rejects.toMatchObject({
            retryable: true,
        });
    });

    test("an unreadable answer is a retryable failure", async () => {
        payload = null;

        await expect(transcribe({ candidate, audio, signal })).rejects.toBeInstanceOf(HarnessError);
    });

    test("carries the provider's usage when it reports one", async () => {
        payload = { text: "hi", usage: { prompt_tokens: 10, completion_tokens: 2 } };

        const result = await transcribe({ candidate, audio, signal });

        expect(result.usage).toEqual({ prompt_tokens: 10, completion_tokens: 2 });
    });
});