import { describe, expect, test } from "bun:test";
import { extensionOptionValue, parseExtensionOptionValue } from "./extension-option-value";

describe("extensionOptionValue", () => {
    test("round-trips", () => {
        expect(parseExtensionOptionValue({ value: extensionOptionValue({ kind: "mcp", id: 3 }) })).toEqual({
            kind: "mcp",
            id: 3,
        });
        expect(parseExtensionOptionValue({ value: extensionOptionValue({ kind: "tool", id: 4 }) })).toEqual({
            kind: "tool",
            id: 4,
        });
        expect(parseExtensionOptionValue({ value: extensionOptionValue({ kind: "skill", id: 5 }) })).toEqual({
            kind: "skill",
            id: 5,
        });
    });

    test("refuses anything else", () => {
        expect(parseExtensionOptionValue({ value: "" })).toBeNull();
        expect(parseExtensionOptionValue({ value: "bot:2" })).toBeNull();
        expect(parseExtensionOptionValue({ value: "tool:x" })).toBeNull();
        expect(parseExtensionOptionValue({ value: "skill:0" })).toBeNull();
    });
});
