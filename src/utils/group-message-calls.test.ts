import { describe, expect, test } from "bun:test";
import type { MessageDetailsCall } from "@/src/types";
import groupMessageCalls from "./group-message-calls";

function call(overrides: Partial<MessageDetailsCall>): MessageDetailsCall {
    return {
        id: 1,
        created_at: 0,
        harness: "text",
        provider_id: 1,
        provider_name: "OpenRouter",
        provider_kind: "openrouter",
        model_slug: "deepseek/deepseek-v4",
        model_name: "DeepSeek V4",
        prompt_tokens: 100,
        completion_tokens: 10,
        cost: null,
        settings: null,
        ...overrides,
    };
}

describe("groupMessageCalls", () => {
    test("sums calls of the same provider, model and harness", () => {
        const groups = groupMessageCalls({
            calls: [call({ id: 1, cost: 0.01 }), call({ id: 2, prompt_tokens: 200, cost: 0.02 })],
        });

        expect(groups).toHaveLength(1);
        expect(groups[0]).toMatchObject({ prompt_tokens: 300, completion_tokens: 20, total_tokens: 320, calls: 2 });
        expect(groups[0]!.cost).toBeCloseTo(0.03);
    });

    test("keeps harnesses and models apart, busiest first", () => {
        const groups = groupMessageCalls({
            calls: [
                call({ id: 1, harness: "vision", model_slug: "small", prompt_tokens: 5, completion_tokens: 0 }),
                call({ id: 2 }),
                call({ id: 3, model_slug: "other" }),
                call({ id: 4 }),
            ],
        });

        expect(groups.map((g) => [g.harness, g.model_slug, g.calls])).toEqual([
            ["text", "deepseek/deepseek-v4", 2],
            ["text", "other", 1],
            ["vision", "small", 1],
        ]);
    });

    test("leaves the cost out when no call reported one", () => {
        const [group] = groupMessageCalls({ calls: [call({})] });

        expect(group!.cost).toBeUndefined();
    });
});
