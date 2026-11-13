import { describe, expect, test } from "bun:test";
import modelContextLength from "./model-context-length";

describe("modelContextLength", () => {
    test("keeps what the provider's own list said", () => {
        expect(
            modelContextLength({ model: { context_length: 1_000_000 }, provider_context_length: 32_768 }),
        ).toBe(1_000_000);
    });

    test("gives a listed model the window its provider declares", () => {
        expect(modelContextLength({ model: {}, provider_context_length: 1_000_000 })).toBe(
            1_000_000,
        );
    });

    test("leaves a model unknown when neither said", () => {
        expect(modelContextLength({ model: {} })).toBeNull();
        expect(modelContextLength({ model: {}, provider_context_length: 0 })).toBeNull();
    });
});