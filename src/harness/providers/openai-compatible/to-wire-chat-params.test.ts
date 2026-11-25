import { describe, expect, test } from "bun:test";
import toWireChatParams from "./to-wire-chat-params";

describe("toWireChatParams", () => {
    test("OpenRouter nests the reasoning effort", () => {
        expect(
            toWireChatParams({
                kind: "openrouter",
                params: { temperature: 0.3, reasoning: { effort: "high" } },
            }),
        ).toEqual({ temperature: 0.3, reasoning: { effort: "high" } });
    });

    test("everyone else takes it flat", () => {
        expect(
            toWireChatParams({
                kind: "custom",
                params: { temperature: 0.3, reasoning: { effort: "high" } },
            }),
        ).toEqual({ temperature: 0.3, reasoning_effort: "high" });
    });

    test("the other settings pass through as they are", () => {
        expect(
            toWireChatParams({
                kind: "openai",
                params: { top_p: 0.5, enable_thinking: false },
            }),
        ).toEqual({ top_p: 0.5, enable_thinking: false });
    });

    test("nothing saved sends nothing", () => {
        expect(toWireChatParams({ kind: "openai" })).toEqual({});
    });
});