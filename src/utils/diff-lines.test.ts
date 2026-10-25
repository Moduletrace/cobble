import { describe, expect, test } from "bun:test";
import diffLines from "./diff-lines";

describe("diffLines", () => {
    test("marks what was added and removed, with context around it", () => {
        const before = ["1", "2", "3", "4", "5", "6", "7", "8"].join("\n");
        const after = ["1", "2", "3", "4", "upload to x", "5", "6", "7", "8"].join("\n");

        expect(diffLines({ before, after, context: 1 })).toBe(["...", "  4", "+ upload to x", "  5", "..."].join("\n"));
    });

    test("shows a replaced line as a removal and an addition", () => {
        expect(diffLines({ before: "a\nb\nc", after: "a\nB\nc" })).toBe("  a\n- b\n+ B\n  c");
    });

    test("is empty when nothing changed", () => {
        expect(diffLines({ before: "same", after: "same" })).toBe("");
    });
});
