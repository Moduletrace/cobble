import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BotTraceRow } from "@/src/types";
import TraceLogLine from "./trace-log-line";

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
 * The debug logs stream one line per step: what ran, a glance at what it
 * answered, and how long it took, with the line cut rather than wrapped so
 * a long tool answer never pushes the next step off screen.
 */
describe("TraceLogLine", () => {
    test("a tool call reads as its name, a cut-down preview and its time", () => {
        const html = renderToString(
            <TraceLogLine
                entry={row({
                    name: "computer_bash",
                    arguments: `{"command":"ls"}`,
                    result: "first line\nsecond line",
                    metadata: JSON.stringify({ index: 1, ok: true, duration_ms: 340 }),
                })}
            />,
        );

        expect(html).toContain("computer_bash");
        expect(html).toContain("first line second line");
        expect(html).toContain("340ms");
        expect(html).toContain("truncate");
    });

    test("a turn with no text still takes a line, with its number", () => {
        const html = renderToString(
            <TraceLogLine entry={row({ kind: "turn", metadata: JSON.stringify({ index: 3 }) })} />,
        );

        expect(html).toContain("Turn 4");
        expect(html).toContain("-");
    });

    test("a failed call keeps its answer readable", () => {
        const html = renderToString(
            <TraceLogLine
                entry={row({
                    name: "read_file",
                    result: "Error: no such file",
                    metadata: JSON.stringify({ index: 0, ok: false, duration_ms: 12 }),
                })}
            />,
        );

        expect(html).toContain("Error: no such file");
        expect(html).toContain("12ms");
    });
});