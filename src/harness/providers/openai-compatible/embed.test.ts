import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { HarnessCandidate } from "../../types";

/**
 * What the provider's `/embeddings` answers for the batch.
 */
let payload: unknown = null;

mock.module("./provider-request", () => ({
    default: async () => ({ json: async () => payload }),
}));

const { default: embed } = await import("./embed");

afterAll(() => mock.restore());

const candidate: HarnessCandidate = {
    key: "1:embed-model",
    provider: { kind: "custom", base_url: "http://localhost:1234", name: "Test" },
    model: { slug: "embed-model", input_modalities: ["text"], output_modalities: ["text"], supports_tools: false },
    source: "pinned",
};
const signal = new AbortController().signal;

beforeEach(() => {
    payload = null;
});

describe("embed places vectors by index (M5)", () => {
    test("an out-of-order batch is paired by index, not by arrival", async () => {
        payload = {
            data: [
                { index: 1, embedding: [2, 2] },
                { index: 0, embedding: [1, 1] },
            ],
            usage: { prompt_tokens: 5 },
        };
        const result = await embed({ candidate, input: ["first", "second"], signal });
        expect(result.vectors).toEqual([
            [1, 1],
            [2, 2],
        ]);
        expect(result.usage?.prompt_tokens).toBe(5);
    });

    test("a bare array (no index) falls back to its position", async () => {
        payload = { data: [[1, 1], [2, 2]] };
        const result = await embed({ candidate, input: ["first", "second"], signal });
        expect(result.vectors).toEqual([
            [1, 1],
            [2, 2],
        ]);
    });

    test("a repeated index is a failed batch", async () => {
        payload = {
            data: [
                { index: 0, embedding: [1] },
                { index: 0, embedding: [2] },
            ],
        };
        await expect(embed({ candidate, input: ["first", "second"], signal })).rejects.toThrow(
            "out of range or twice",
        );
    });

    test("an index past the batch (a gap) is a failed batch", async () => {
        payload = {
            data: [
                { index: 0, embedding: [1] },
                { index: 2, embedding: [2] },
            ],
        };
        await expect(embed({ candidate, input: ["first", "second"], signal })).rejects.toThrow(
            "out of range or twice",
        );
    });

    test("a missing vector for one text is a failed batch", async () => {
        payload = { data: [{ index: 0, embedding: [1] }] };
        await expect(embed({ candidate, input: ["first", "second"], signal })).rejects.toThrow(
            "1 of 2 texts got a vector",
        );
    });
});
