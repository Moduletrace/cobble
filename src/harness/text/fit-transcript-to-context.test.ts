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

const params = { system: "s", context_length: 200, keep_last: 4 };

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
