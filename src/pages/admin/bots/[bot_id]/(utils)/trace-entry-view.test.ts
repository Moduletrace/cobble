import { describe, expect, test } from "bun:test";
import type { BotTraceRow } from "@/src/types";
import traceEntryView from "./trace-entry-view";

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

describe("traceEntryView", () => {
    test("numbers a turn from its one-based step and shows the model, time and tools", () => {
        expect(
            traceEntryView({
                entry: row({
                    metadata: JSON.stringify({
                        index: 2,
                        model: "gpt-x",
                        duration_ms: 1200,
                        tools: ["a", "b"],
                        finish_reason: "length",
                    }),
                }),
            }),
        ).toEqual({
            title: "Turn 3",
            meta: ["gpt-x", "1.2s", "2 tools", "length"],
            text: undefined,
            reasoning: undefined,
            duration: "1.2s",
            tools: ["a", "b"],
            failed: false,
        });
    });

    test("leaves out a `stop` finish reason and a missing duration", () => {
        expect(
            traceEntryView({ entry: row({ metadata: JSON.stringify({ index: 0, finish_reason: "stop" }) }) }),
        ).toMatchObject({ title: "Turn 1", meta: [], duration: undefined });
    });

    test("a tool call is its name, marked failed only when the app said so", () => {
        expect(
            traceEntryView({
                entry: row({
                    kind: "tool",
                    name: "computer_bash",
                    arguments: "{}",
                    result: "Error: nope",
                    metadata: JSON.stringify({ ok: false, duration_ms: 40 }),
                }),
            }),
        ).toMatchObject({
            title: "computer_bash",
            arguments: "{}",
            result: "Error: nope",
            failed: true,
            meta: ["40ms"],
        });

        expect(
            traceEntryView({
                entry: row({
                    kind: "tool",
                    name: "read_file",
                    result: "ok",
                    metadata: JSON.stringify({ ok: true, repeat_of: 2, images: 1 }),
                }),
            }),
        ).toMatchObject({ failed: false, meta: ["1 images", "already read"] });
    });

    test("an event reads as words, not as its name", () => {
        expect(
            traceEntryView({
                entry: row({ kind: "event", name: "wrap_up", text: "Out of steps." }),
            }),
        ).toMatchObject({ title: "Out of room: last turn", text: "Out of steps." });

        expect(
            traceEntryView({ entry: row({ kind: "event", name: "something_new" }) }),
        ).toMatchObject({ title: "something_new" });
    });

    test("a broken metadata blob is no metadata, never a crash", () => {
        expect(traceEntryView({ entry: row({ metadata: "{not json" }) })).toMatchObject({
            title: "Turn 1",
            meta: [],
        });
    });
});