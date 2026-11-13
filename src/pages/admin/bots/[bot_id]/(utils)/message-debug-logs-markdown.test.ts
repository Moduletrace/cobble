import { describe, expect, test } from "bun:test";
import type { BotTraceJob, BotTraceRow } from "@/src/types";
import messageDebugLogsMarkdown from "./message-debug-logs-markdown";

function row(overrides: Partial<BotTraceRow>): BotTraceRow {
    return {
        id: 1,
        created_at: 0,
        job_id: 1,
        bot_id: 1,
        kind: "turn",
        name: null,
        text: null,
        reasoning: null,
        arguments: null,
        result: null,
        metadata: null,
        ...overrides,
    };
}

function job(traces: BotTraceRow[], overrides: Partial<BotTraceJob> = {}): BotTraceJob {
    return { id: 1, kind: "reply", title: null, status: "completed", created_at: 0, traces, ...overrides };
}

const format_time = (time: number) => `t${time}`;

describe("messageDebugLogsMarkdown", () => {
    test("names the message and every step in order", () => {
        const markdown = messageDebugLogsMarkdown({
            message_id: 485,
            now: 9,
            format_time,
            jobs: [
                job([
                    row({
                        kind: "turn",
                        text: "Looking at the tabs.",
                        reasoning: "Check the browser first.",
                        metadata: JSON.stringify({
                            index: 0,
                            model: "gpt-x",
                            duration_ms: 1200,
                            tools: ["browser_tabs"],
                        }),
                    }),
                    row({
                        id: 2,
                        kind: "tool",
                        name: "browser_tabs",
                        arguments: `{"action":"list"}`,
                        result: "three tabs",
                        metadata: JSON.stringify({ index: 0, ok: true, duration_ms: 340 }),
                    }),
                ]),
            ],
        });

        expect(markdown).toContain("# Debug logs");
        expect(markdown).toContain("- Message: #485");
        expect(markdown).toContain("## Reply (reply, finished)");
        expect(markdown).toContain("### Turn 1");
        expect(markdown).toContain("gpt-x, 1.2s, 1 tools");
        expect(markdown).toContain("Asked for: browser_tabs");
        expect(markdown).toContain("**Reasoned**");
        expect(markdown).toContain("Check the browser first.");
        expect(markdown).toContain("### browser_tabs");
        expect(markdown).toContain("**Arguments**");
        expect(markdown).toContain(`{"action":"list"}`);
        expect(markdown).toContain("three tabs");
    });

    test("a failed call says so, and an empty run says it kept nothing", () => {
        const markdown = messageDebugLogsMarkdown({
            message_id: 7,
            now: 0,
            format_time,
            jobs: [
                job([row({ kind: "tool", name: "read_file", result: "Error: gone", metadata: JSON.stringify({ ok: false }) })]),
                job([], { id: 2, kind: "task", title: "The audit", status: "failed" }),
            ],
        });

        expect(markdown).toContain("### read_file (failed)");
        expect(markdown).toContain("Error: gone");
        expect(markdown).toContain("## The audit (task, failed)");
        expect(markdown).toContain("No steps were kept for this run.");
    });

    test("text holding a fence of its own is fenced longer", () => {
        const markdown = messageDebugLogsMarkdown({
            message_id: 1,
            now: 0,
            format_time,
            jobs: [job([row({ kind: "tool", name: "read_file", result: "```js\nconst a = 1;\n```" })])],
        });

        expect(markdown).toContain("````\n```js\nconst a = 1;\n```\n````");
    });
});