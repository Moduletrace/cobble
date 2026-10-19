import { describe, expect, test } from "bun:test";
import parseModelSize from "./parse-model-size";

describe("parseModelSize", () => {
    test("reads total parameters, skipping active ones", () => {
        expect(parseModelSize({ slug: "qwen/qwen3-30b-a3b" })).toBe(30);
        expect(
            parseModelSize({ slug: "nvidia/nemotron-3-ultra-550b-a55b:free" }),
        ).toBe(550);
        expect(parseModelSize({ slug: "liquid/lfm-2.5-2.6b:free" })).toBe(2.6);
        expect(parseModelSize({ slug: "deepseek-r1:14b" })).toBe(14);
    });

    test("reads trillions", () => {
        expect(parseModelSize({ slug: "qwen/qwen3.8-2.4t-a95b" })).toBe(2400);
    });

    test("is undefined when the slug has no size", () => {
        expect(parseModelSize({ slug: "deepseek/deepseek-v4.1-flash" })).toBe(
            undefined,
        );
        expect(parseModelSize({ slug: "google/gemma-3n-e4b-it" })).toBe(
            undefined,
        );
    });
});
