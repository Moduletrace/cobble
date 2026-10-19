import { describe, expect, test } from "bun:test";
import type { HarnessCandidate } from "@/src/harness/types";
import describeJobStep from "./describe-job-step";

const candidate = { model: { slug: "deepseek/deepseek-chat:free" } } as HarnessCandidate;

describe("describeJobStep", () => {
    test("names each tool once, never its arguments", () => {
        expect(
            describeJobStep({
                index: 2,
                text: "Let me look.",
                candidate,
                tool_calls: [
                    { id: "a", name: "sandbox_execute_bash", arguments: '{"command":"cat secret"}' },
                    { id: "b", name: "sandbox_execute_bash", arguments: "{}" },
                    { id: "c", name: "update_memory", arguments: "{}" },
                ],
            }),
        ).toEqual({
            kind: "tool",
            text: "Using sandbox_execute_bash, update_memory",
            metadata: {
                step: 2,
                model: "deepseek/deepseek-chat:free",
                tools: ["sandbox_execute_bash", "update_memory"],
            },
        });
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
