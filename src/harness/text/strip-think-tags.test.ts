import { describe, expect, test } from "bun:test";
import stripThinkTags from "./strip-think-tags";

describe("stripThinkTags", () => {
    test("removes reasoning blocks", () => {
        expect(stripThinkTags({ text: "\u003cthink\u003eplan\nmore\u003c/think\u003e\n\nDone." }).text).toBe("Done.");
        expect(stripThinkTags({ text: "A \u003cTHINK\u003ex\u003c/THINK\u003eB" }).text).toBe("A B");
    });

    test("keeps what was reasoned, in order", () => {
        expect(
            stripThinkTags({ text: "\u003cthink\u003efirst\u003c/think\u003ea \u003cthink\u003esecond\u003c/think\u003eb" }).reasoning,
        ).toBe("first\n\nsecond");
        expect(stripThinkTags({ text: "\u003cTHINK\u003ex\u003c/THINK\u003eB" }).reasoning).toBe("x");
        expect(stripThinkTags({ text: "no reasoning here" }).reasoning).toBe(null);
    });

    test("drops an unclosed block at the start, keeping it as reasoning", () => {
        expect(stripThinkTags({ text: "  \u003cthink\u003enever ends" })).toEqual({
            text: "",
            reasoning: "never ends",
        });
    });

    test("leaves plain text alone", () => {
        expect(stripThinkTags({ text: " Hello " })).toEqual({ text: "Hello", reasoning: null });
    });
});
