import { describe, expect, test } from "bun:test";
import extensionNoun, { extensionLogTitle } from "./extension-noun";

describe("extensionNoun", () => {
    test("names each kind, with or without its article", () => {
        expect(extensionNoun({ kind: "mcp" })).toBe("MCP server");
        expect(extensionNoun({ kind: "tool" })).toBe("tool");
        expect(extensionNoun({ kind: "skill" })).toBe("skill");
        expect(extensionNoun({ kind: "skill", article: true })).toBe("the skill");
    });
});

describe("extensionLogTitle", () => {
    test("capitalizes the noun and adds what happened", () => {
        expect(extensionLogTitle({ kind: "mcp", verb: "added" })).toBe("MCP server added");
        expect(extensionLogTitle({ kind: "tool", verb: "removed" })).toBe("Tool removed");
        expect(extensionLogTitle({ kind: "skill", verb: "added" })).toBe("Skill added");
    });
});
