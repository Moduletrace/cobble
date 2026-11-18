import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";

/**
 * What the provider's `/embeddings` answers for the batch.
 */
let payload: unknown = null;

/**
 * What the provider does with a batch: answer with `payload`, or throw to
 * refuse it.
 */
let answer: (body: any) => unknown = () => payload;

/**
 * Every batch the adapter sent, in order.
 */
let sent: any[] = [];

mock.module("./provider-request", () => ({
    default: async ({ json }: { json: any }) => {
        sent.push(json);
        const result = answer(json);
        if (result instanceof Error) throw result;
        return { json: async () => result };
    },
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
    answer = () => payload;
    sent = [];
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
        const result = await embed({ candidate, input: ["first", "second"], purpose: "passage", signal });
        expect(result.vectors).toEqual([
            [1, 1],
            [2, 2],
        ]);
        expect(result.usage?.prompt_tokens).toBe(5);
    });

    test("a bare array (no index) falls back to its position", async () => {
        payload = { data: [[1, 1], [2, 2]] };
        const result = await embed({ candidate, input: ["first", "second"], purpose: "passage", signal });
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
        await expect(
            embed({ candidate, input: ["first", "second"], purpose: "passage", signal }),
        ).rejects.toThrow("out of range or twice");
    });

    test("an index past the batch (a gap) is a failed batch", async () => {
        payload = {
            data: [
                { index: 0, embedding: [1] },
                { index: 2, embedding: [2] },
            ],
        };
        await expect(
            embed({ candidate, input: ["first", "second"], purpose: "passage", signal }),
        ).rejects.toThrow("out of range or twice");
    });

    test("a missing vector for one text is a failed batch", async () => {
        payload = { data: [{ index: 0, embedding: [1] }] };
        await expect(
            embed({ candidate, input: ["first", "second"], purpose: "passage", signal }),
        ).rejects.toThrow("1 of 2 texts got a vector");
    });
});

describe("embed asks for input_type when the model needs it", () => {
    /**
     * A model like NVIDIA's Nemotron ones: a batch with no `input_type` is
     * refused, and the message says so.
     */
    const asymmetric: HarnessCandidate = {
        key: "10:asymmetric-model",
        provider: { kind: "custom", base_url: "http://localhost:4001", name: "Nvidia Cloud" },
        model: {
            slug: "nvidia/asymmetric-embed",
            input_modalities: ["text"],
            output_modalities: ["text"],
            supports_tools: false,
        },
        source: "pinned",
    };

    const refuseWithoutType = (body: any) => {
        if (body.input_type) return { data: [{ index: 0, embedding: [1, 1] }] };

        throw new HarnessError({
            message: `${asymmetric.provider.name}: 'input_type' parameter is required for asymmetric models`,
            status: 400,
        });
    };

    test("a passage is indexed as a passage, and the next batch skips the probe", async () => {
        answer = refuseWithoutType;

        const first = await embed({
            candidate: asymmetric,
            input: ["a document's text"],
            purpose: "passage",
            signal,
        });
        expect(first.vectors).toEqual([[1, 1]]);
        expect(sent.map((body) => body.input_type)).toEqual([undefined, "passage"]);

        await embed({ candidate: asymmetric, input: ["another passage"], purpose: "passage", signal });
        expect(sent).toHaveLength(3);
        expect(sent[2]!.input_type).toBe("passage");
    });

    test("a query is asked for as a query", async () => {
        const queried: HarnessCandidate = {
            ...asymmetric,
            key: "10:asymmetric-model",
            provider: { ...asymmetric.provider, base_url: "http://localhost:4002" },
        };

        answer = refuseWithoutType;

        await embed({ candidate: queried, input: ["what is it?"], purpose: "query", signal });
        expect(sent.map((body) => body.input_type)).toEqual([undefined, "query"]);
    });

    test("a refusal that isn't about input_type is not retried", async () => {
        const other: HarnessCandidate = {
            ...asymmetric,
            provider: { ...asymmetric.provider, base_url: "http://localhost:4003" },
        };

        answer = () => {
            throw new HarnessError({
                message: `${asymmetric.provider.name}: model not found`,
                status: 400,
            });
        };

        await expect(
            embed({ candidate: other, input: ["a document's text"], purpose: "passage", signal }),
        ).rejects.toThrow("model not found");
        expect(sent).toHaveLength(1);
    });
});