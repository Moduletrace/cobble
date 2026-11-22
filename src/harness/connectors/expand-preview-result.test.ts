import { describe, expect, test } from "bun:test";
import expandPreviewResult from "./expand-preview-result";

function previewText() {
    return JSON.stringify({
        data: {
            results: [
                {
                    response: {
                        data_preview: {
                            messages: [{ messageId: "a" }, { messageId: "b" }, "...8 more items"],
                        },
                        next_steps: "Write code to parse the saved response.",
                    },
                },
            ],
        },
    });
}

const whole = { messages: [{ messageId: "a" }, { messageId: "b" }] };

describe("expandPreviewResult", () => {
    test("asks the provider again and returns the whole result", async () => {
        let calls = 0;

        const text = await expandPreviewResult({
            text: previewText(),
            retry: async () => {
                calls += 1;

                return whole;
            },
        });

        expect(calls).toBe(1);
        expect(JSON.parse(text)).toEqual(whole);
    });

    test("keeps the preview's note when the retry fails", async () => {
        const text = await expandPreviewResult({
            text: previewText(),
            retry: async () => {
                throw new Error("401 API key is required");
            },
        });

        expect(text).toContain("2 of 10 items are here");
    });

    test("keeps the preview's note when there is no retry to make", async () => {
        const text = await expandPreviewResult({ text: previewText() });

        expect(text).toContain("2 of 10 items are here");
    });

    test("rewrites a retry that came back cut as well", async () => {
        const text = await expandPreviewResult({
            text: previewText(),
            retry: async () => ({ data_preview: { messages: [{ messageId: "a" }, "...9 more items"] } }),
        });

        expect(text).toContain("1 of 10 items are here");
        expect(text).not.toContain("data_preview");
    });

    test("leaves a whole answer alone and asks nothing", async () => {
        let calls = 0;
        const text = JSON.stringify(whole);

        const answer = await expandPreviewResult({
            text,
            retry: async () => {
                calls += 1;

                return whole;
            },
        });

        expect(answer).toBe(text);
        expect(calls).toBe(0);
    });
});