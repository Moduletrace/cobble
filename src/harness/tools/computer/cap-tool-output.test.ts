import { describe, expect, test } from "bun:test";
import capToolOutput from "./cap-tool-output";

describe("capToolOutput", () => {
    test("leaves short text alone", () => {
        expect(capToolOutput({ text: "abc", max_chars: 10 })).toBe("abc");
    });

    test("keeps the start and the end of long text", () => {
        const out = capToolOutput({ text: `${"a".repeat(50)}${"b".repeat(50)}`, max_chars: 20 });

        expect(out.startsWith("a".repeat(8))).toBe(true);
        expect(out.endsWith("b".repeat(12))).toBe(true);
        expect(out).toContain("80 characters left out");
    });
});
