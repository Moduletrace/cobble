import { describe, expect, test } from "bun:test";
import mcpToolName from "./mcp-tool-name";

describe("mcpToolName", () => {
    test("joins the slug and tool, sanitizing the tool's name", () => {
        expect(mcpToolName({ slug: "files", name: "read.file" })).toBe("files__read_file");
        expect(mcpToolName({ slug: "files", name: "list-dir" })).toBe("files__list-dir");
    });

    test("a name that fits is left as it is", () => {
        const name = mcpToolName({ slug: "srv", name: "short_tool" });

        expect(name).toBe("srv__short_tool");
        expect(name.length).toBeLessThanOrEqual(64);
    });

    test("two long names sharing a prefix stay distinct (L10)", () => {
        const prefix = "a".repeat(70);
        const first = mcpToolName({ slug: "srv", name: `${prefix}_one` });
        const second = mcpToolName({ slug: "srv", name: `${prefix}_two` });

        expect(first).not.toBe(second);
        expect(first.length).toBeLessThanOrEqual(64);
        expect(second.length).toBeLessThanOrEqual(64);
    });

    test("a cut name is stable for the same tool", () => {
        const long = "b".repeat(80);

        expect(mcpToolName({ slug: "srv", name: long })).toBe(mcpToolName({ slug: "srv", name: long }));
    });
});