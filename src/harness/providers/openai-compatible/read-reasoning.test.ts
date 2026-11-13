import { describe, expect, test } from "bun:test";
import readReasoning from "./read-reasoning";

describe("readReasoning", () => {
    test("reads the reason OpenRouter hands back", () => {
        expect(readReasoning({ message: { reasoning: "They want a report." } })).toBe(
            "They want a report.",
        );
    });

    test("reads DeepSeek's spelling too", () => {
        expect(readReasoning({ message: { reasoning_content: "  Two plus two.  " } })).toBe(
            "Two plus two.",
        );
    });

    test("joins a reason given as parts", () => {
        expect(
            readReasoning({
                message: { reasoning: [{ text: "First. " }, { text: "Then the answer." }] },
            }),
        ).toBe("First. Then the answer.");
    });

    test("falls back to the readable details", () => {
        expect(
            readReasoning({
                message: {
                    reasoning_details: [
                        { type: "reasoning.encrypted", data: "gibberish" },
                        { type: "reasoning.summary", summary: "Checked the numbers." },
                    ],
                },
            }),
        ).toBe("Checked the numbers.");
    });

    test("is null when there's nothing readable", () => {
        expect(readReasoning({ message: {} })).toBeNull();
        expect(readReasoning({ message: { reasoning: "   " } })).toBeNull();
        expect(readReasoning({ message: { reasoning_details: [{ data: "x" }] } })).toBeNull();
        expect(readReasoning({ message: null })).toBeNull();
    });
});