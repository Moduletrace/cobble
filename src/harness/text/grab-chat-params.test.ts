import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { HarnessModelInfo } from "../types";

/**
 * The setting the call reads, swapped per test: what is saved in it and
 * what the model advertises decide what goes on the wire.
 */
let options: Record<string, unknown> = {};

mock.module("@/src/functions/backend/db/harness/grab-harness-setting", () => ({
    default: async () => ({
        harness: "text",
        fallback: true,
        enabled: true,
        options,
        source: "default",
    }),
}));

const grabChatParams = (await import("./grab-chat-params")).default;

afterAll(() => {
    mock.restore();
});

function model(supported?: string[]): HarnessModelInfo {
    return {
        slug: "test/model",
        input_modalities: ["text"],
        output_modalities: ["text"],
        supports_tools: true,
        supported_parameters: supported,
    };
}

beforeEach(() => {
    options = {};
});

describe("grabChatParams", () => {
    test("sends a saved value to a model that advertises the field", async () => {
        options = { temperature: 0.7 };
        const { paramsFor } = await grabChatParams({ harness: "text" });

        expect(paramsFor(model(["temperature"]))).toEqual({ temperature: 0.7 });
    });

    test("sends nothing to a model whose provider lists no parameters", async () => {
        options = { temperature: 0.7, top_p: 0.9 };
        const { paramsFor } = await grabChatParams({ harness: "text" });

        expect(paramsFor(model(undefined))).toEqual({});
        expect(paramsFor(model([]))).toEqual({});
    });

    test("drops a saved value the model does not advertise", async () => {
        options = { temperature: 0.7, seed: 42 };
        const { paramsFor } = await grabChatParams({ harness: "text" });

        expect(paramsFor(model(["temperature"]))).toEqual({ temperature: 0.7 });
    });

    test("sends the harness default only where it is advertised", async () => {
        const { paramsFor } = await grabChatParams({ harness: "text" });

        expect(paramsFor(model(["temperature"]))).toEqual({ temperature: 0.3 });
        expect(paramsFor(model(["top_p"]))).toEqual({});
        expect(paramsFor(model(undefined))).toEqual({});
    });

    test("a saved zero is kept, an empty string is not", async () => {
        options = { temperature: 0, reasoning_effort: "" };
        const { paramsFor } = await grabChatParams({ harness: "text" });

        expect(paramsFor(model(["temperature", "reasoning"]))).toEqual({ temperature: 0 });
    });

    test("reasoning effort goes on the wire nested under reasoning", async () => {
        options = { reasoning_effort: "high" };
        const { paramsFor } = await grabChatParams({ harness: "text" });

        expect(paramsFor(model(["reasoning"]))).toEqual({ reasoning: { effort: "high" } });
        expect(paramsFor(model(["reasoning_effort"]))).toEqual({});
    });

    test("thinking on/off goes on the wire as a boolean", async () => {
        options = { enable_thinking: "false" };
        const { paramsFor } = await grabChatParams({ harness: "text" });

        expect(paramsFor(model(["enable_thinking"]))).toEqual({
            enable_thinking: false,
        });
    });

    test("the vision default is a literal 0", async () => {
        const { paramsFor } = await grabChatParams({ harness: "vision" });

        expect(paramsFor(model(["temperature"]))).toEqual({ temperature: 0 });
        expect(paramsFor(model(undefined))).toEqual({});
    });
});
