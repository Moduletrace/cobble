import { describe, expect, test } from "bun:test";
import extensionStateNote from "./extension-state-note";

describe("extensionStateNote", () => {
    test("an extension that's off says so first", () => {
        expect(extensionStateNote({ item: { kind: "mcp", state: "error", enabled: false } })).toBe("Off for every bot");
    });

    test("a skill never reports a failure", () => {
        expect(extensionStateNote({ item: { kind: "skill", state: "error", enabled: true } })).toBe("");
    });

    test("a knowledgebase reports a document it couldn't read", () => {
        expect(extensionStateNote({ item: { kind: "knowledgebase", state: "error", enabled: true } })).toBe(
            "A document couldn't be read",
        );
        expect(extensionStateNote({ item: { kind: "knowledgebase", state: "ok", enabled: true } })).toBe("");
    });

    test("tools and servers report their checks", () => {
        expect(extensionStateNote({ item: { kind: "tool", state: "error", enabled: true } })).toBe("Not working");
        expect(extensionStateNote({ item: { kind: "mcp", state: "untested", enabled: true } })).toBe("Not checked yet");
        expect(extensionStateNote({ item: { kind: "mcp", state: "ok", enabled: true } })).toBe("");
    });
});
