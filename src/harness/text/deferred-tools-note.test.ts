import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";
import deferredToolsNote from "./deferred-tools-note";

function tool({ name, group }: { name: string; group?: string }) {
    return { name, description: `Does ${name}.`, group } as unknown as HarnessTool;
}

describe("deferredToolsNote", () => {
    test("a big namespace is one line of names, not a line per description", () => {
        const count = AppData.HarnessDeferredNamespaceMin;
        const tools = Array.from({ length: count }, (_, index) => tool({ name: `github__TOOL_${index}` }));
        const note = deferredToolsNote({ tools });

        expect(note).toContain(`- github (${count} tools): github__TOOL_0, github__TOOL_1,`);
        expect(note).not.toContain("Does github__TOOL_0.");
        expect(note.split("\n")).toHaveLength(2);
    });

    test("a small namespace still names each tool", () => {
        const note = deferredToolsNote({ tools: [tool({ name: "gmail__SEND" }), tool({ name: "gmail__FETCH" })] });

        expect(note).toContain("- gmail__SEND: Does gmail__SEND.");
        expect(note).toContain("- gmail__FETCH: Does gmail__FETCH.");
    });

    test("a family and a tool with no namespace are listed as before", () => {
        const note = deferredToolsNote({
            tools: [tool({ name: "read_file", group: "files" }), tool({ name: "browser_click" })],
        });

        expect(note).toContain("- files: read_file (load the family by its name)");
        expect(note).toContain("- browser_click: Does browser_click.");
    });
});