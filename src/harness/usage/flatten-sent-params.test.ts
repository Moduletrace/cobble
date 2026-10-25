import { describe, expect, test } from "bun:test";
import flattenSentParams from "./flatten-sent-params";

describe("flattenSentParams", () => {
    test("reads the nested reasoning effort back by its setting key", () => {
        expect(flattenSentParams({ params: { temperature: 0.3, reasoning: { effort: "high" } } })).toEqual({
            temperature: 0.3,
            reasoning_effort: "high",
        });
    });

    test("keeps a zero and drops empty fields", () => {
        expect(flattenSentParams({ params: { temperature: 0, seed: "" } })).toEqual({ temperature: 0 });
    });

    test("is undefined when nothing was sent", () => {
        expect(flattenSentParams({ params: {} })).toBeUndefined();
        expect(flattenSentParams({ params: null })).toBeUndefined();
    });
});
