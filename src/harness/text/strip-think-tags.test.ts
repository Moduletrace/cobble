import { describe, expect, test } from "bun:test";
import stripThinkTags from "./strip-think-tags";

describe("stripThinkTags", () => {
    test("removes reasoning blocks", () => {
        expect(
            stripThinkTags({ text: "<think>plan\nmore</think>\n\nDone." }),
        ).toBe("Done.");
        expect(
            stripThinkTags({ text: "A <THINK>x</THINK>B <think>y</think>C" }),
        ).toBe("A B C");
    });

    test("drops an unclosed block at the start", () => {
        expect(stripThinkTags({ text: "<think>never ends" })).toBe("");
    });

    test("leaves plain text alone", () => {
        expect(stripThinkTags({ text: " Hello " })).toBe("Hello");
    });
});
