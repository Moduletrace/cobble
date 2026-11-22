import { describe, expect, test } from "bun:test";
import previewResult from "./preview-result";

function gmailMessage({ id }: { id: string }) {
    return {
        messageId: id,
        threadId: id,
        labelIds: ["CATEGORY_PROMOTIONS", "...1 more items"],
        subject: `Subject ${id}`,
        preview: { body: `Body ${id}` },
    };
}

/**
 * The answer Composio's MCP router gave a Gmail fetch of 10 messages: two of
 * them, a marker for the other eight, and instructions to parse a file the
 * app never receives.
 */
function gmailPreview() {
    return {
        successful: true,
        data: {
            results: [
                {
                    response: {
                        successful: true,
                        data_preview: {
                            messages: [
                                gmailMessage({ id: "1a201de2616a75cd" }),
                                gmailMessage({ id: "1a201dc5ff69132f" }),
                                "...8 more items",
                            ],
                            nextPageToken: "token",
                            resultSizeEstimate: 201,
                        },
                        tool_slug: "GMAIL_FETCH_EMAILS",
                        index: 0,
                        structure_info: {
                            data_structure: { properties: { messages: { type: "array", length: 10 } } },
                        },
                        next_steps: "Write code to parse the saved response and run the analysis.",
                    },
                    error: null,
                    log_id: "log-1",
                },
            ],
        },
    };
}

describe("previewResult", () => {
    test("says how much of a preview is missing and keeps the items", () => {
        const result = previewResult({ text: JSON.stringify(gmailPreview()) });

        expect(result.preview).toBe(true);

        if (!result.preview) throw new Error("expected a preview");

        expect(result.text).toContain("2 of 10 items are here");
        expect(result.text).toContain("the other 8 were cut");
        expect(result.text).toContain("1a201de2616a75cd");
        expect(result.text).toContain("1a201dc5ff69132f");
        expect(result.text).not.toContain("structure_info");
        expect(result.text).not.toContain("next_steps");
        expect(result.text).not.toContain("log_id");
        expect(result.text).not.toContain("saved response");
    });

    test("leaves a whole result alone", () => {
        const result = previewResult({
            text: JSON.stringify({ messages: [{ messageId: "a" }, { messageId: "b" }] }),
        });

        expect(result).toEqual({ preview: false });
    });

    test("leaves a non-JSON answer alone", () => {
        expect(previewResult({ text: "Gmail: two messages" })).toEqual({ preview: false });
    });

    test("says only part is here when the preview marks nothing as cut", () => {
        const result = previewResult({ text: JSON.stringify({ data_preview: { messages: [] } }) });

        if (!result.preview) throw new Error("expected a preview");

        expect(result.text).toContain("only part of it is here");
        expect(result.text).toContain("never an empty result");
    });
});