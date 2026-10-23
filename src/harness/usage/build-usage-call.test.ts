import { describe, expect, test } from "bun:test";
import type { HarnessCandidate } from "../types";
import buildUsageCall from "./build-usage-call";

function model(overrides: { row_id?: number } = {}) {
    return {
        slug: "deepseek/deepseek-chat",
        name: "DeepSeek Chat",
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_tools: true,
        ...overrides,
    } as HarnessCandidate["model"];
}

function candidate(overrides: Partial<HarnessCandidate> = {}): HarnessCandidate {
    return {
        provider: {
            id: 2,
            name: "OpenRouter",
            kind: "openrouter",
        } as HarnessCandidate["provider"],
        key: "openrouter:deepseek/deepseek-chat",
        source: "auto",
        model: model({ row_id: 41 }),
        ...overrides,
    };
}

describe("buildUsageCall", () => {
    test("names the candidate that really answered and what it spent", () => {
        const call = buildUsageCall({
            harness: "text",
            candidate: candidate(),
            usage: { prompt_tokens: 1200, completion_tokens: 340, cost: 0.0042 },
        });

        expect(call).toEqual({
            harness: "text",
            provider_id: 2,
            provider_name: "OpenRouter",
            model_id: 41,
            model_slug: "deepseek/deepseek-chat",
            prompt_tokens: 1200,
            completion_tokens: 340,
            cost: 0.0042,
        });
    });

    test("a provider with no name reads as its kind", () => {
        const call = buildUsageCall({
            harness: "image",
            candidate: candidate({
                provider: { id: 4, name: "", kind: "openai" } as HarnessCandidate["provider"],
            }),
            usage: { prompt_tokens: 0, completion_tokens: 0 },
        });

        expect(call.provider_name).toBe("openai");
    });

    test("a provider that reports no usage still gets a row", () => {
        const call = buildUsageCall({ harness: "transcription", candidate: candidate() });

        expect(call.prompt_tokens).toBe(0);
        expect(call.completion_tokens).toBe(0);
        expect(call.cost).toBeUndefined();
    });

    test("a candidate with no catalog row has no model id to point at", () => {
        const call = buildUsageCall({
            harness: "text",
            candidate: candidate({
                model: model({ slug: "made-up-model" } as any),
            }),
            usage: { prompt_tokens: 10, completion_tokens: 5 },
        });

        expect(call.model_id).toBeUndefined();
        expect(call.model_slug).toBe("made-up-model");
    });

    test("a cost the provider did not report is left out, not zeroed", () => {
        const call = buildUsageCall({
            harness: "text",
            candidate: candidate(),
            usage: { prompt_tokens: 10, completion_tokens: 5, cost: Number.NaN },
        });

        expect(call.cost).toBeUndefined();
    });

    test("a free provider's zero cost is kept as zero", () => {
        const call = buildUsageCall({
            harness: "text",
            candidate: candidate(),
            usage: { prompt_tokens: 10, completion_tokens: 5, cost: 0 },
        });

        expect(call.cost).toBe(0);
    });
});
