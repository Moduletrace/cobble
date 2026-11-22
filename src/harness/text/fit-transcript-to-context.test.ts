import { describe, expect, test } from "bun:test";
import type { HarnessMessage } from "../types";
import fitTranscriptToContext from "./fit-transcript-to-context";

/**
 * A tool result long enough to be cut to its two ends (over
 * `TrimmedKeepChars * 4`), with markers at each end so a later collapse to
 * a bare stub is visible.
 */
const huge = `START_MARKER_${"x".repeat(6000)}_END_MARKER`;

function transcript(): HarnessMessage[] {
    return [
        { role: "tool", tool_call_id: "c1", content: huge },
        { role: "user", content: "u1" },
        { role: "assistant", content: "a1" },
        { role: "user", content: "u2" },
        {
            role: "assistant",
            content: "a2",
            tool_calls: [{ id: "c1", name: "computer_bash", arguments: "{}" }],
        },
    ];
}

const params = { system: "s", working_tokens: 140, keep_last: 4 };

describe("fitTranscriptToContext keeps a head+tail trim across passes (M4)", () => {
    test("a long result is cut to its start and end, not replaced whole", () => {
        const messages = transcript();
        const result = fitTranscriptToContext({ ...params, transcript: messages });

        expect(result.trimmed).toBe(1);
        const content = messages[0]!.content as string;
        expect(content).toContain("[Trimmed:");
        expect(content).toContain("START_MARKER_");
        expect(content).toContain("_END_MARKER");
        expect(content).toContain("start and end are kept");
    });

    test("a second pass leaves the kept ends alone and does not count the cut again", () => {
        const messages = transcript();
        fitTranscriptToContext({ ...params, transcript: messages });
        const after_first = messages[0]!.content as string;

        const second = fitTranscriptToContext({ ...params, transcript: messages });

        // The marker sits in the middle of a head+tail trim: it must still
        // read as already cut, so the ends survive and the count is not paid
        // twice.
        expect(second.trimmed).toBe(0);
        expect(messages[0]!.content).toBe(after_first);
        expect(messages[0]!.content as string).toContain("START_MARKER_");
        expect(messages[0]!.content as string).toContain("_END_MARKER");
    });
});

describe("fitTranscriptToContext never leaves a run reading a note instead of an answer", () => {
    test("a result short enough to keep whole is kept whole", () => {
        const messages: HarnessMessage[] = [
            { role: "tool", tool_call_id: "c1", content: "/usr/bin/pdftoppm" },
        ];

        // Far below the result, so every pass that could cut it runs.
        const result = fitTranscriptToContext({ system: "s", transcript: messages, working_tokens: 10 });

        expect(result.trimmed).toBe(0);
        expect(messages[0]!.content).toBe("/usr/bin/pdftoppm");
    });

    test("the newest turn's results are cut last, only once the older ones are gone", () => {
        const old = `OLD_START_${"x".repeat(30_000)}_OLD_END`;
        const fresh = `FRESH_START_${"y".repeat(6000)}_FRESH_END`;

        const messages: HarnessMessage[] = [
            { role: "tool", tool_call_id: "old", content: old },
            { role: "user", content: "u1" },
            {
                role: "assistant",
                content: "a1",
                tool_calls: [{ id: "new", name: "computer_bash", arguments: "{}" }],
            },
            { role: "tool", tool_call_id: "new", content: fresh },
        ];

        // Enough room once the older result is cut, so the newest one stays.
        const result = fitTranscriptToContext({
            system: "s",
            transcript: messages,
            working_tokens: 5_000,
            keep_last: 0,
        });

        expect(result.trimmed).toBe(1);
        expect(messages[0]!.content as string).toContain("OLD_START_");
        expect(messages[3]!.content).toBe(fresh);
    });
});

describe("fitTranscriptToContext names what is over the working context", () => {
    test("its own instructions alone past the context is static", () => {
        const result = fitTranscriptToContext({
            system: "x".repeat(3_000),
            transcript: [],
            working_tokens: 500,
        });

        expect(result.over_budget).toBe("static");
        expect(result.base).toBe(result.system_tokens);
    });

    test("tool definitions count toward the static part", () => {
        const result = fitTranscriptToContext({
            system: "s",
            transcript: [],
            working_tokens: 500,
            tools_chars: 3_000,
        });

        expect(result.over_budget).toBe("static");
        expect(result.tools_tokens).toBe(1_000);
    });

    test("a conversation the user made too long is the request", () => {
        const result = fitTranscriptToContext({
            system: "s",
            transcript: [{ role: "user", content: "y".repeat(3_000) }],
            working_tokens: 500,
            keep_last: 0,
        });

        expect(result.over_budget).toBe("request");
        // The user's own text is never cut.
        expect(result.trimmed).toBe(0);
    });

    test("a prompt that fits says nothing is over", () => {
        const result = fitTranscriptToContext({ system: "s", transcript: [], working_tokens: 500 });

        expect(result.over_budget).toBe(false);
    });
});
