import { describe, expect, test } from "bun:test";
import type { HarnessCatalogModel } from "../types";
import rankAutoModels from "./rank-auto-models";

const day = 24 * 60 * 60 * 1000;

function model(
    slug: string,
    extra: Partial<HarnessCatalogModel> = {},
): HarnessCatalogModel {
    return {
        slug,
        free: true,
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_tools: true,
        context_length: 262144,
        released_at: 0,
        ...extra,
    };
}

/**
 * OpenRouter's free list on 2026-10-18 (no DeepSeek or Qwen that day).
 */
const live = [
    model("xingchen-agi/xing4.0-29b-a4b:free", { released_at: 20 * day }),
    model("nvidia/nemotron-3.5-super-vl:free", {
        input_modalities: ["text", "image", "video"],
        intelligence_score: 26.5,
    }),
    model("liquid/lfm-2.5-2.6b:free", {
        context_length: 65536,
        intelligence_score: 8.4,
    }),
    model("nvidia/nemotron-3.5-lightning:free", { intelligence_score: 12.9 }),
    model("thinkingmachines/inkling-small:free", {
        input_modalities: ["text", "image", "audio"],
        intelligence_score: 25.7,
        agentic_score: 23.5,
    }),
    model("cohere/north-mini-code:free", { intelligence_score: 9.9 }),
    model("nvidia/nemotron-3.5-content-safety:free", {
        supports_tools: false,
    }),
    model("nvidia/nemotron-3-ultra-550b-a55b:free", {
        intelligence_score: 22.9,
    }),
    model("google/gemma-4-31b-it:free", {
        input_modalities: ["image", "text", "video"],
        intelligence_score: 14.7,
    }),
    model("openrouter/free", { input_modalities: ["text", "image"] }),
    model("anthropic/claude-paid", { free: false }),
];

const slugs = (models: HarnessCatalogModel[]) => models.map((m) => m.slug);

describe("rankAutoModels", () => {
    test("follows the vendor preference, then competent others, then routers", () => {
        expect(slugs(rankAutoModels({ models: live, harness: "text" }))).toEqual(
            [
                "nvidia/nemotron-3.5-super-vl:free",
                "nvidia/nemotron-3-ultra-550b-a55b:free",
                "nvidia/nemotron-3.5-lightning:free",
                "liquid/lfm-2.5-2.6b:free",
                "thinkingmachines/inkling-small:free",
                "google/gemma-4-31b-it:free",
                "xingchen-agi/xing4.0-29b-a4b:free",
                "openrouter/free",
            ],
        );
    });

    test("puts DeepSeek, then Qwen, ahead of everything once they're free", () => {
        const ranked = rankAutoModels({
            models: [
                ...live,
                model("qwen/qwen3.8-flash:free"),
                model("deepseek/deepseek-v4.1-flash:free"),
            ],
            harness: "text",
        });

        expect(slugs(ranked).slice(0, 2)).toEqual([
            "deepseek/deepseek-v4.1-flash:free",
            "qwen/qwen3.8-flash:free",
        ]);
    });

    test("recognises vendors in local model names", () => {
        const ranked = rankAutoModels({
            models: [model("llama3.3:70b"), model("qwen3:32b")],
            harness: "text",
        });

        expect(slugs(ranked)).toEqual(["qwen3:32b", "llama3.3:70b"]);
    });

    test("filters by what the harness needs", () => {
        expect(
            slugs(rankAutoModels({ models: live, harness: "vision" })),
        ).toEqual([
            "nvidia/nemotron-3.5-super-vl:free",
            "thinkingmachines/inkling-small:free",
            "google/gemma-4-31b-it:free",
            "openrouter/free",
        ]);
        expect(
            slugs(rankAutoModels({ models: live, harness: "transcription" })),
        ).toEqual(["thinkingmachines/inkling-small:free"]);
        expect(rankAutoModels({ models: live, harness: "speech" })).toEqual(
            [],
        );
    });

    test("puts speech-to-text models ahead of chat models that hear audio", () => {
        const ranked = rankAutoModels({
            models: [
                model("deepseek/omni", { input_modalities: ["text", "audio"] }),
                model("acme/scribe", {
                    input_modalities: ["audio"],
                    output_modalities: ["transcription"],
                    supports_tools: false,
                }),
            ],
            harness: "transcription",
        });

        expect(slugs(ranked)).toEqual(["acme/scribe", "deepseek/omni"]);
    });

    test("drops retired and unscored small models from other vendors", () => {
        const ranked = rankAutoModels({
            models: [
                model("acme/tiny-7b"),
                model("acme/big-mini"),
                model("acme/gone", { expires_at: 10 }),
                model("acme/short", { context_length: 8000 }),
                model("acme/solid-70b"),
            ],
            harness: "text",
            now: 100,
        });

        expect(slugs(ranked)).toEqual(["acme/solid-70b"]);
    });

    test("within a vendor, unscored full-size models beat small ones, newest first", () => {
        const ranked = rankAutoModels({
            models: [
                model("deepseek/deepseek-lite", { released_at: 3 }),
                model("deepseek/deepseek-old", { released_at: 1 }),
                model("deepseek/deepseek-new", { released_at: 2 }),
            ],
            harness: "text",
        });

        expect(slugs(ranked)).toEqual([
            "deepseek/deepseek-new",
            "deepseek/deepseek-old",
            "deepseek/deepseek-lite",
        ]);
    });
});
