import { describe, expect, test } from "bun:test";
import unknownToolMessage from "./unknown-tool-message";

describe("unknownToolMessage", () => {
    test("lists the tools for an unknown tool", () => {
        expect(unknownToolMessage({ name: "nope", tools: [{ name: "a" }, { name: "b" }] })).toBe(
            `Error: There is no tool called "nope". Available: a, b.`,
        );
    });

    test("points a reply's browser call to send_reply with work", () => {
        const text = unknownToolMessage({ name: "browser_navigate", tools: [{ name: "send_reply" }] });

        expect(text).toContain("only exist in a task on a computer");
        expect(text).toContain('call send_reply with status "working" and work');
    });

    test("points a task run's browser call to start_task", () => {
        const text = unknownToolMessage({ name: "browser_navigate", tools: [{ name: "start_task" }] });

        expect(text).toContain("only exist in a task on a computer");
        expect(text).toContain("call start_task");
    });

    test("says where computer tools live without offering start_task when there is none", () => {
        const text = unknownToolMessage({ name: "computer_bash", tools: [{ name: "list_files" }] });

        expect(text).toContain("only exist in a task on a computer");
        expect(text).not.toContain("start_task");
    });

    /**
     * The user's own browser's tools carry the browser's slug, so a reply that
     * has one is not short of a browser: it named the tool the wrong way.
     */
    test("names the slug when the run's browser tools have one", () => {
        const text = unknownToolMessage({
            name: "browser_navigate",
            tools: [{ name: "send_reply" }, { name: "work-laptop__browser_navigate" }],
        });

        expect(text).toContain(`the browser's slug, e.g. "work-laptop__browser_navigate"`);
        expect(text).not.toContain("only exist in a task");
    });

    /**
     * A task run's own `browser_*` tools have no slug, so an excluded one must
     * not be told to look for a prefixed name it does not have.
     */
    test("keeps the task message for a computer browser tool", () => {
        const text = unknownToolMessage({
            name: "browser_close",
            tools: [{ name: "browser_navigate" }, { name: "computer_bash" }],
        });

        expect(text).toContain("only exist in a task on a computer");
        expect(text).not.toContain("slug");
    });
});
