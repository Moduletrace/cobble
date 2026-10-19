import { describe, expect, test } from "bun:test";
import { extensionOptionValue, parseExtensionOptionValue } from "./extension-option-value";

describe("extensionOptionValue", () => {
    test("round-trips", () => {
        expect(parseExtensionOptionValue({ value: extensionOptionValue({ kind: "mcp", id: 3 }) })).toEqual({
            kind: "mcp",
            id: 3,
        });
    });

    test("refuses anything else", () => {
        expect(parseExtensionOptionValue({ value: "" })).toBeNull();
        expect(parseExtensionOptionValue({ value: "bot:2" })).toBeNull();
        expect(parseExtensionOptionValue({ value: "tool:x" })).toBeNull();
    });
});
