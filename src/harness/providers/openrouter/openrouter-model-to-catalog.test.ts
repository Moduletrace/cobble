import { describe, expect, test } from "bun:test";
import openRouterModelToCatalog from "./openrouter-model-to-catalog";

describe("openRouterModelToCatalog", () => {
    test("maps modalities, tools, scores and dates", () => {
        expect(
            openRouterModelToCatalog({
                model: {
                    id: "nvidia/nemotron-3.5-super-vl:free",
                    name: "NVIDIA: Nemotron 3.5 Super VL (free)",
                    created: 1792000000,
                    context_length: 1000000,
                    architecture: {
                        input_modalities: ["text", "image"],
                        output_modalities: ["text"],
                    },
                    supported_parameters: ["tools", "temperature"],
                    top_provider: { max_completion_tokens: 65536 },
                    expiration_date: "2026-12-01",
                    benchmarks: {
                        artificial_analysis: {
                            intelligence_index: 26.5,
                            agentic_index: null,
                        },
                    },
                },
            }),
        ).toEqual({
            slug: "nvidia/nemotron-3.5-super-vl:free",
            name: "NVIDIA: Nemotron 3.5 Super VL (free)",
            free: true,
            input_modalities: ["text", "image"],
            output_modalities: ["text"],
            supports_tools: true,
            context_length: 1000000,
            max_output_tokens: 65536,
            voices: undefined,
            released_at: 1792000000000,
            expires_at: Date.parse("2026-12-01"),
            intelligence_score: 26.5,
            agentic_score: undefined,
        });
    });

    test("only :free models and the free router count as free", () => {
        const free = (id: string) =>
            openRouterModelToCatalog({ model: { id } }).free;

        expect(free("qwen/qwen3.8-flash:free")).toBe(true);
        expect(free("openrouter/free")).toBe(true);
        expect(free("google/lyria-3-pro-preview")).toBe(false);
    });

    test("fills gaps with text-only defaults", () => {
        const entry = openRouterModelToCatalog({ model: { id: "a/b" } });

        expect(entry.input_modalities).toEqual(["text"]);
        expect(entry.supports_tools).toBe(false);
        expect(entry.expires_at).toBe(undefined);
    });
});
