import { describe, expect, test } from "bun:test";
import toolArgumentPath from "./tool-argument-path";

/**
 * The path a trace keeps when the rest of the arguments is cut. It has to
 * be forgiving: a tool may have no path, and arguments arrive as the model
 * wrote them.
 */
describe("toolArgumentPath", () => {
    test("reads the path a write names", () => {
        expect(toolArgumentPath({ text: `{"path":"reports/q3.md","content":"..."}` })).toBe("reports/q3.md");
        expect(toolArgumentPath({ text: `{"file_path":"src/server.ts","old_text":"a"}` })).toBe("src/server.ts");
    });

    test("is null for a tool that names no file", () => {
        expect(toolArgumentPath({ text: `{"command":"ls -la"}` })).toBeNull();
        expect(toolArgumentPath({ text: `{"path":"   "}` })).toBeNull();
    });

    test("is null for arguments it can't read, or that aren't an object", () => {
        expect(toolArgumentPath({ text: null })).toBeNull();
        expect(toolArgumentPath({ text: "" })).toBeNull();
        expect(toolArgumentPath({ text: "{nope" })).toBeNull();
        expect(toolArgumentPath({ text: `["a.md"]` })).toBeNull();
    });
});