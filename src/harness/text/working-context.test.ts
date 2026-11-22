import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import workingContextTokens, { WorkingContextReserveMax, WorkingContextReserveMin } from "./working-context";

describe("workingContextTokens", () => {
    test("a declared window keeps a tenth of it for the answer", () => {
        const context = workingContextTokens({ context_length: 131_072 });

        expect(context.window).toBe(131_072);
        expect(context.assumed).toBe(false);
        expect(context.reserve).toBe(13_107);
        expect(context.tokens).toBe(117_965);
    });

    test("a 200,000 token window keeps 20,000 back", () => {
        expect(workingContextTokens({ context_length: 200_000 }).tokens).toBe(180_000);
    });

    test("a 1,000,000 token window keeps the most a run ever reserves", () => {
        const context = workingContextTokens({ context_length: 1_000_000 });

        expect(context.reserve).toBe(WorkingContextReserveMax);
        expect(context.tokens).toBe(936_000);
    });

    test("a model that declares its output size keeps exactly that back", () => {
        const context = workingContextTokens({ context_length: 131_072, max_output_tokens: 4_096 });

        expect(context.reserve).toBe(4_096);
        expect(context.tokens).toBe(126_976);
    });

    test("a model with no declared window is worked to the install's assumption", () => {
        const context = workingContextTokens({});

        expect(context.window).toBe(AppData.HarnessUnknownContextWindow);
        expect(context.assumed).toBe(true);
        expect(context.tokens).toBe(AppData.HarnessUnknownContextWindow - WorkingContextReserveMax);
    });

    test("the install's cap holds a run below its window, never above it", () => {
        expect(workingContextTokens({ context_length: 1_000_000, context_budget: 50_000 }).tokens).toBe(50_000);
        expect(workingContextTokens({ context_length: 1_000_000, context_budget: 990_000 }).tokens).toBe(936_000);
    });

    test("an unlimited cap leaves the window deciding", () => {
        expect(workingContextTokens({ context_length: 200_000, context_budget: "unlimited" }).tokens).toBe(180_000);
    });

    test("the reserve never swallows the window, on the smallest model", () => {
        const context = workingContextTokens({ context_length: 12_000, max_output_tokens: 12_000 });

        expect(context.reserve).toBe(11_999);
        expect(context.tokens).toBe(1);
    });

    test("the smallest reserve is kept even on a tiny window", () => {
        expect(workingContextTokens({ context_length: 50_000 }).reserve).toBe(WorkingContextReserveMin);
    });
});
