import { describe, expect, test } from "bun:test";
import checkCustomToolName from "./check-custom-tool-name";
import mcpServerSlug from "./mcp-server-slug";
import mcpToolName from "./mcp-tool-name";

describe("checkCustomToolName", () => {
    test("takes snake_case", () => {
        expect(checkCustomToolName({ name: "get_weather" })).toBeNull();
    });

    test("refuses built-ins, computer prefixes, double underscores and bad shapes", () => {
        expect(checkCustomToolName({ name: "start_task" })).toContain("built-in");
        expect(checkCustomToolName({ name: "sandbox_run" })).toContain("sandbox_");
        expect(checkCustomToolName({ name: "a__b" })).toContain("double underscore");
        expect(checkCustomToolName({ name: "Get-Weather" })).toContain("lowercase");
        expect(checkCustomToolName({ name: "1abc" })).toContain("lowercase");
    });
});

describe("mcpToolName", () => {
    test("prefixes with the slug, cleans and caps the name", () => {
        expect(mcpToolName({ slug: "github", name: "create.issue" })).toBe("github__create_issue");
        expect(mcpToolName({ slug: "s", name: "x".repeat(80) })).toHaveLength(64);
    });
});

describe("mcpServerSlug", () => {
    test("slugs a name", () => {
        expect(mcpServerSlug({ name: "GitHub (work)" })).toBe("github_work");
        expect(mcpServerSlug({ name: "!!!" })).toBe("mcp");
    });
});
