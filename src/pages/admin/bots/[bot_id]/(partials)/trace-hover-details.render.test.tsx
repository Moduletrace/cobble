import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BotTraceRow } from "@/src/types";
import TraceHoverDetails from "./trace-hover-details";

function row(overrides: Partial<BotTraceRow>): BotTraceRow {
    return {
        id: 1,
        created_at: 0,
        job_id: 1,
        bot_id: 1,
        kind: "tool",
        name: null,
        text: null,
        reasoning: null,
        arguments: null,
        result: null,
        metadata: null,
        ...overrides,
    };
}

/**
 * The strip cuts each step to one line; hovering reads it whole, from what
 * it was sent to what it answered.
 */
describe("TraceHoverDetails", () => {
    test("a tool call keeps its whole arguments and answer, uncut", () => {
        const long = "line\n".repeat(200);
        const html = renderToString(
            <TraceHoverDetails
                entry={row({
                    name: "computer_bash",
                    arguments: `{"command":"${long}"}`,
                    result: `${long}done`,
                    metadata: JSON.stringify({ index: 1, ok: true, duration_ms: 340 }),
                })}
            />,
        );

        expect(html).toContain("computer_bash - 340ms");
        expect(html).toContain("Sent");
        expect(html).toContain("Answered");
        expect(html).toContain("done");
        expect(html).not.toContain("cut:");
    });

    test("a turn shows what it reasoned before what it wrote", () => {
        const html = renderToString(
            <TraceHoverDetails
                entry={row({
                    kind: "turn",
                    reasoning: "Look at the tabs first.",
                    text: "Two tabs are open.",
                    metadata: JSON.stringify({ index: 0, tools: ["browser_tabs"] }),
                })}
            />,
        );

        expect(html).toContain("Asked for: browser_tabs");
        expect(html).toContain("Reasoned");
        expect(html).toContain("Look at the tabs first.");
        expect(html).toContain("Wrote");
        expect(html).toContain("Two tabs are open.");
        expect(html.indexOf("Reasoned")).toBeLessThan(html.indexOf("Wrote"));
    });

    test("a failed call says so in its title", () => {
        const html = renderToString(
            <TraceHoverDetails entry={row({ name: "read_file", result: "Error: gone", metadata: JSON.stringify({ ok: false }) })} />,
        );

        expect(html).toContain("read_file (failed)");
    });
});