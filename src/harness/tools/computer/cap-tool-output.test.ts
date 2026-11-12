import { describe, expect, test } from "bun:test";
import capToolOutput from "./cap-tool-output";

describe("capToolOutput", () => {
    test("leaves short text alone", () => {
        expect(capToolOutput({ text: "abc", max_chars: 10 })).toBe("abc");
    });

    test("keeps the start and the end of long text", () => {
        const out = capToolOutput({ text: `${"a".repeat(50)}${"b".repeat(50)}`, max_chars: 60 });

        expect(out.startsWith("a")).toBe(true);
        expect(out.endsWith("b")).toBe(true);
        expect(out).toContain("40 characters left out");
    });

    test("stays inside max_chars, so the harness never cuts its end off again", () => {
        const out = capToolOutput({ text: "h".repeat(20000) + "totals", max_chars: 20000 });

        expect(out.length).toBeLessThanOrEqual(20000);
        expect(out).toEndWith("totals");
    });
});
