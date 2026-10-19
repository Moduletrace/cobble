import { describe, expect, test } from "bun:test";
import type { HarnessCandidate } from "@/src/harness/types";
import describeJobStep from "./describe-job-step";

const candidate = { model: { slug: "deepseek/deepseek-chat:free" } } as HarnessCandidate;

describe("describeJobStep", () => {
    test("says what each tool does once, never its arguments", () => {
        expect(
            describeJobStep({
                index: 2,
                text: null,
                candidate,
                tool_calls: [
                    { id: "a", name: "sandbox_execute_bash", arguments: '{"command":"cat secret"}' },
                    { id: "b", name: "sandbox_execute_bash", arguments: "{}" },
                    { id: "c", name: "update_memory", arguments: "{}" },
                ],
            }),
        ).toEqual({
            kind: "tool",
            text: "Running a command, Updating memory",
            metadata: {
                step: 2,
                model: "deepseek/deepseek-chat:free",
                tools: ["sandbox_execute_bash", "update_memory"],
            },
        });
    });

    test("prefers what the model said it's doing", () => {
        expect(
            describeJobStep({
                index: 0,
                text: "Opening the Gmail tab.\nThen reading it.",
                candidate,
                tool_calls: [{ id: "a", name: "browser_navigate", arguments: "{}" }],
            })?.text,
        ).toBe("Opening the Gmail tab.");
    });

    test("labels tool families and falls back to the name", () => {
        expect(
            describeJobStep({
                index: 0,
                text: "",
                candidate,
                tool_calls: [
                    { id: "a", name: "browser_navigate", arguments: "{}" },
                    { id: "b", name: "browser_click", arguments: "{}" },
                    { id: "c", name: "get_weather", arguments: "{}" },
                ],
            })?.text,
        ).toBe("Using the browser, Using get weather");
    });

    test("names an MCP server's tool in words", () => {
        expect(
            describeJobStep({
                index: 0,
                text: null,
                candidate,
                tool_calls: [{ id: "a", name: "exa_search__web_search_exa", arguments: "{}" }],
            })?.text,
        ).toBe("Using Exa search (web search exa)");
    });

    test("keeps the first line of a text-only turn, cut to one line", () => {
        const step = describeJobStep({
            index: 0,
            text: `\n  ${"a".repeat(250)}\nSecond line`,
            candidate,
            tool_calls: [],
        });

        expect(step?.kind).toBe("note");
        expect(step?.text).toHaveLength(200);
        expect(step?.text.endsWith("…")).toBe(true);
    });

    test("skips an empty turn", () => {
        expect(describeJobStep({ index: 0, text: "  ", candidate, tool_calls: [] })).toBeNull();
    });
});
