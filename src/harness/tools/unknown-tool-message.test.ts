import { describe, expect, test } from "bun:test";
import unknownToolMessage from "./unknown-tool-message";

describe("unknownToolMessage", () => {
    test("lists the tools for an unknown tool", () => {
        expect(unknownToolMessage({ name: "nope", tools: [{ name: "a" }, { name: "b" }] })).toBe(
            `Error: There is no tool called "nope". Available: a, b.`,
        );
    });

    test("points a reply's browser call to start_task", () => {
        const text = unknownToolMessage({ name: "browser_navigate", tools: [{ name: "start_task" }] });

        expect(text).toContain("only exist in a task on a computer");
        expect(text).toContain("call start_task");
    });

    test("says where computer tools live without offering start_task when there is none", () => {
        const text = unknownToolMessage({ name: "computer_bash", tools: [{ name: "list_files" }] });

        expect(text).toContain("only exist in a task on a computer");
        expect(text).not.toContain("start_task");
    });
});
