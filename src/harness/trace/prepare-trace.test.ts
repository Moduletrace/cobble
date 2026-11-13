import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import type { HarnessTrace } from "./types";
import prepareTrace from "./prepare-trace";

describe("prepareTrace", () => {
    test("keeps a turn's numbers and tool names in its metadata", () => {
        const metadata = JSON.parse(
            prepareTrace({
                trace: {
                    kind: "turn",
                    index: 2,
                    model: "openai/gpt-x",
                    provider: "OpenRouter",
                    text: "On it.",
                    reasoning: "They asked for a report.",
                    tool_calls: [
                        { name: "write_file", arguments: "{}" },
                        { name: "list_files", arguments: "{}" },
                    ],
                    usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0 },
                    finish_reason: "tool_calls",
                    duration_ms: 1200,
                },
            }).metadata || "{}",
        );

        expect(metadata).toEqual({
            index: 2,
            model: "openai/gpt-x",
            provider: "OpenRouter",
            finish_reason: "tool_calls",
            duration_ms: 1200,
            tools: ["write_file", "list_files"],
            usage: { prompt_tokens: 10, completion_tokens: 4, cost: 0 },
        });
    });

    test("keeps a turn's answer and reasoning, and no arguments", () => {
        const prepared = prepareTrace({
            trace: {
                kind: "turn",
                index: 0,
                model: null,
                provider: null,
                text: "Done.",
                reasoning: "Simple.",
                tool_calls: [],
                usage: null,
                finish_reason: "stop",
                duration_ms: 1,
            },
        });

        expect(prepared).toMatchObject({
            kind: "turn",
            name: null,
            text: "Done.",
            reasoning: "Simple.",
            arguments: null,
            result: null,
        });
    });

    test("keeps whether a tool call failed, and cuts its answer", () => {
        const long_answer = "x".repeat(AppData.BotTraceResultMaxChars + 10);

        const prepared = prepareTrace({
            trace: {
                kind: "tool",
                index: 1,
                name: "computer_bash",
                arguments: `{"command":"ls"}`,
                result: long_answer,
                ok: false,
                images: 0,
                duration_ms: 40,
            },
        });

        expect(JSON.parse(prepared.metadata || "{}")).toEqual({
            index: 1,
            ok: false,
            images: 0,
            duration_ms: 40,
            repeat_of: null,
        });
        expect(prepared.name).toBe("computer_bash");
        expect(prepared.result).toContain("[cut: 10 more characters not kept]");
        expect(prepared.text).toBeNull();
        expect(prepared.reasoning).toBeNull();
    });

    test("keeps an event's name and note", () => {
        const prepared = prepareTrace({
            trace: { kind: "event", index: 4, name: "steps_low", text: "5 steps left." },
        });

        expect(prepared).toMatchObject({
            kind: "event",
            name: "steps_low",
            text: "5 steps left.",
            reasoning: null,
            arguments: null,
            result: null,
        });
        expect(JSON.parse(prepared.metadata || "{}")).toEqual({ index: 4 });
    });

    test("a call the loop skipped says which step answered it", () => {
        const prepared = prepareTrace({
            trace: {
                kind: "tool",
                index: 3,
                name: "read_file",
                arguments: "{}",
                result: "Already read.",
                ok: true,
                images: 0,
                duration_ms: 0,
                repeat_of: 1,
            },
        });

        expect(JSON.parse(prepared.metadata || "{}").repeat_of).toBe(1);
    });

    test("every trace kind carries a fragment of the same shape", () => {
        const traces: HarnessTrace[] = [
            {
                kind: "turn",
                index: 0,
                model: null,
                provider: null,
                text: null,
                reasoning: null,
                tool_calls: [],
                usage: null,
                finish_reason: null,
                duration_ms: 0,
            },
            {
                kind: "tool",
                index: 0,
                name: "x",
                arguments: "",
                result: "",
                ok: true,
                images: 0,
                duration_ms: 0,
            },
            { kind: "event", index: 0, name: "e", text: null },
        ];

        for (const trace of traces) {
            const prepared = prepareTrace({ trace });

            expect(Object.keys(prepared).sort()).toEqual([
                "arguments",
                "kind",
                "metadata",
                "name",
                "reasoning",
                "result",
                "text",
            ]);
        }
    });
});