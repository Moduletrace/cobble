import { describe, expect, test } from "bun:test";
import capTraceText from "./cap-trace-text";

describe("capTraceText", () => {
    test("keeps a text that fits whole", () => {
        expect(capTraceText({ text: "Saved.", max: 20 })).toBe("Saved.");
    });

    test("is null when there's nothing to keep", () => {
        expect(capTraceText({ text: null, max: 20 })).toBeNull();
        expect(capTraceText({ text: "", max: 20 })).toBeNull();
        expect(capTraceText({ text: undefined, max: 20 })).toBeNull();
    });

    test("keeps the start and says how much was cut", () => {
        const text = "a".repeat(120);

        expect(capTraceText({ text, max: 100 })).toBe(
            `${"a".repeat(100)}\n[cut: 20 more characters not kept]`,
        );
    });

    test("keeps exactly `max` characters without cutting", () => {
        const text = "b".repeat(40);

        expect(capTraceText({ text, max: 40 })).toBe(text);
    });
});