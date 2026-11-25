import { describe, expect, test } from "bun:test";
import providerParameterKeys from "./provider-parameter-keys";

describe("provider parameter keys", () => {
    test("a provider's own saved pick wins over its preset", () => {
        expect(
            providerParameterKeys({
                kind: "openai",
                declared: ["seed"],
            }),
        ).toEqual(["seed"]);
    });

    test("an empty saved pick means it takes none", () => {
        expect(
            providerParameterKeys({ kind: "openai", declared: [] }),
        ).toEqual([]);
    });

    test("a preset's list fills a provider that saved none", () => {
        expect(
            providerParameterKeys({ kind: "groq", base_url: "https://api.groq.com/openai/v1" }),
        ).toContain("temperature");
    });

    test("a custom provider on Alibaba gets Alibaba's list", () => {
        const keys = providerParameterKeys({
            kind: "custom",
            base_url: "https://token-plan.us-east-1.maas.aliyuncs.com/compatible-mode/v1",
        });

        expect(keys).toContain("enable_thinking");
        expect(keys).toContain("thinking_budget");
    });

    test("a custom provider elsewhere gets nothing rather than a guess", () => {
        expect(
            providerParameterKeys({
                kind: "custom",
                base_url: "http://localhost:8000/v1",
            }),
        ).toBeUndefined();
    });

    test("OpenRouter keeps its catalog's own list", () => {
        expect(
            providerParameterKeys({
                kind: "openrouter",
                base_url: "https://openrouter.ai/api/v1",
            }),
        ).toBeUndefined();
    });
});