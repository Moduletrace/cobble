import { describe, expect, test } from "bun:test";
import type { HarnessMessage } from "../types";
import fitTranscriptToContext from "./fit-transcript-to-context";

const big = "x".repeat(30000);

const run = (): HarnessMessage[] => [
    { role: "user", content: "Do the thing." },
    { role: "assistant", content: null, tool_calls: [{ id: "1", name: "computer_bash", arguments: "{}" }] },
    { role: "tool", tool_call_id: "1", content: big },
    { role: "assistant", content: null, tool_calls: [{ id: "2", name: "computer_bash", arguments: "{}" }] },
    { role: "tool", tool_call_id: "2", content: big },
    { role: "assistant", content: null, tool_calls: [{ id: "3", name: "computer_bash", arguments: "{}" }] },
    { role: "tool", tool_call_id: "3", content: "recent" },
];

describe("fitTranscriptToContext", () => {
    test("leaves a transcript that fits alone", () => {
        const transcript = run();
        const result = fitTranscriptToContext({ system: "s", transcript, context_length: 200000 });

        expect(result.trimmed).toBe(0);
        expect(transcript[2]!.content).toBe(big);
    });

    test("trims the oldest tool output first, keeping the newest", () => {
        const transcript = run();
        const result = fitTranscriptToContext({ system: "s", transcript, context_length: 26000 });

        expect(result.trimmed).toBe(1);
        expect(String(transcript[2]!.content)).toContain("characters of the middle of this computer_bash output");
        expect(transcript[4]!.content).toBe(big);
        expect(transcript[6]!.content).toBe("recent");
        expect(result.estimated_tokens).toBeLessThanOrEqual(result.budget);
    });

    test("keeps both ends of what it trimmed, so the run need not call it again", () => {
        const content = `HEAD${'x'.repeat(30000)}TAIL`;
        const transcript: HarnessMessage[] = [
            { role: "user", content: "go" },
            { role: "assistant", content: null, tool_calls: [{ id: "1", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "1", content },
            { role: "assistant", content: null, tool_calls: [{ id: "2", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "2", content: "second" },
            { role: "assistant", content: null, tool_calls: [{ id: "3", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "3", content: "ok" },
        ];

        fitTranscriptToContext({ system: "s", transcript, context_length: 1_000_000, budget_tokens: 8000 });

        const trimmed = String(transcript[2]!.content);

        expect(trimmed).toStartWith("HEAD");
        expect(trimmed).toEndWith("TAIL");
        expect(trimmed).toContain("than repeating it");
        expect(trimmed.length).toBeLessThan(content.length);
    });

    test("says nothing about ends it did not keep, for a short result", () => {
        const transcript: HarnessMessage[] = [
            { role: "user", content: "go" },
            { role: "assistant", content: null, tool_calls: [{ id: "1", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "1", content: "short answer" },
            { role: "assistant", content: null, tool_calls: [{ id: "2", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "2", content: "second" },
            { role: "assistant", content: null, tool_calls: [{ id: "3", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "3", content: "ok" },
        ];

        fitTranscriptToContext({ system: "s", transcript, context_length: 1_000_000, budget_tokens: 50 });

        expect(String(transcript[2]!.content)).toStartWith("[Trimmed: 12 characters of this computer_bash output");
    });

    test("never trims the newest messages, even over budget", () => {
        const transcript: HarnessMessage[] = [
            { role: "user", content: "go" },
            { role: "tool", tool_call_id: "1", content: big },
        ];
        const result = fitTranscriptToContext({ system: "s", transcript, context_length: 1000 });

        expect(result.trimmed).toBe(0);
        expect(transcript[1]!.content).toBe(big);
    });

    test("keeps to the working context even when the window is far larger", () => {
        const transcript = run();
        const result = fitTranscriptToContext({
            system: "s",
            transcript,
            context_length: 1_000_000,
            budget_tokens: 15000,
        });

        expect(result.budget).toBe(15000);
        expect(result.trimmed).toBe(1);
        expect(String(transcript[2]!.content)).toContain("[Trimmed:");
        expect(transcript[4]!.content).toBe(big);
    });

    test("cuts in one block, down to well under the budget, then leaves it alone", () => {
        const transcript = run();
        const first = fitTranscriptToContext({ system: "s", transcript, context_length: 1_000_000, budget_tokens: 18000 });

        expect(first.trimmed).toBe(1);

        transcript.push(
            { role: "assistant", content: null, tool_calls: [{ id: "4", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "4", content: "x".repeat(9000) },
        );

        const second = fitTranscriptToContext({ system: "s", transcript, context_length: 1_000_000, budget_tokens: 18000 });

        expect(second.trimmed).toBe(0);
    });

    test("counts the tool definitions against the budget", () => {
        const transcript = run();
        const without = fitTranscriptToContext({ system: "s", transcript: run(), context_length: 1_000_000, budget_tokens: 25000 });
        const with_tools = fitTranscriptToContext({
            system: "s",
            transcript,
            context_length: 1_000_000,
            budget_tokens: 25000,
            tools_chars: 30000,
        });

        expect(without.trimmed).toBe(0);
        expect(with_tools.trimmed).toBeGreaterThan(0);
    });

    test("cuts long tool call arguments once the results are gone", () => {
        const long = JSON.stringify({ path: "a.html", content: "y".repeat(30000) });
        const transcript: HarnessMessage[] = [
            { role: "user", content: "Write the page." },
            { role: "assistant", content: null, tool_calls: [{ id: "1", name: "computer_write_file", arguments: long }] },
            { role: "tool", tool_call_id: "1", content: "Written." },
            { role: "assistant", content: null, tool_calls: [{ id: "2", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "2", content: "ok" },
            { role: "assistant", content: null, tool_calls: [{ id: "3", name: "computer_bash", arguments: "{}" }] },
            { role: "tool", tool_call_id: "3", content: "ok" },
        ];

        fitTranscriptToContext({ system: "s", transcript, context_length: 1_000_000, budget_tokens: 5000 });

        const call = (transcript[1] as { tool_calls: { arguments: string }[] }).tool_calls[0]!;

        expect(JSON.parse(call.arguments).trimmed).toContain(`${long.length} characters`);
    });
});
