import { describe, expect, test } from "bun:test";
import type { HarnessMessage } from "../types";
import fitTranscriptToContext from "./fit-transcript-to-context";

const big = "x".repeat(30000);

const run = (): HarnessMessage[] => [
    { role: "user", content: "Do the thing." },
    { role: "assistant", content: null, tool_calls: [{ id: "1", name: "sandbox_execute_bash", arguments: "{}" }] },
    { role: "tool", tool_call_id: "1", content: big },
    { role: "assistant", content: null, tool_calls: [{ id: "2", name: "sandbox_execute_bash", arguments: "{}" }] },
    { role: "tool", tool_call_id: "2", content: big },
    { role: "assistant", content: null, tool_calls: [{ id: "3", name: "sandbox_execute_bash", arguments: "{}" }] },
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
        const result = fitTranscriptToContext({ system: "s", transcript, context_length: 20000 });

        expect(result.trimmed).toBe(1);
        expect(String(transcript[2]!.content)).toStartWith("[Trimmed: 30000 characters");
        expect(transcript[4]!.content).toBe(big);
        expect(transcript[6]!.content).toBe("recent");
        expect(result.estimated_tokens).toBeLessThanOrEqual(result.budget);
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
});
