import { describe, expect, test } from "bun:test";
import mcpResultToText from "./mcp-result-to-text";

describe("mcpResultToText", () => {
    test("joins text parts", () => {
        expect(
            mcpResultToText({
                result: {
                    content: [
                        { type: "text", text: "one" },
                        { type: "text", text: "two" },
                    ],
                },
            }),
        ).toEqual({ text: "one\n\ntwo", images: [] });
    });

    test("hands images back, marked where they were", () => {
        expect(
            mcpResultToText({
                result: {
                    content: [
                        { type: "text", text: "Took it." },
                        { type: "image", data: "aGk=", mimeType: "image/jpeg" },
                        { type: "image", data: "aGk=" },
                    ],
                },
            }),
        ).toEqual({
            text: "Took it.\n\n[Image 1: shown after the tool results]\n\n[Image 2: shown after the tool results]",
            images: [
                { data: "aGk=", mime_type: "image/jpeg" },
                { data: "aGk=", mime_type: "image/png" },
            ],
        });
    });

    test("notes an image with no data", () => {
        expect(
            mcpResultToText({
                result: { content: [{ type: "image", mimeType: "image/png" }] },
            }).text,
        ).toBe("[Image (image/png), empty]");
    });

    test("falls back to structured content", () => {
        expect(
            mcpResultToText({
                result: { content: [], structuredContent: { ok: true } },
            }).text,
        ).toBe(`{"ok":true}`);
    });

    test("throws error results", () => {
        expect(() =>
            mcpResultToText({
                result: {
                    isError: true,
                    content: [{ type: "text", text: "No such file" }],
                },
            }),
        ).toThrow("No such file");
    });

    test("says when the tool returned nothing", () => {
        expect(mcpResultToText({ result: {} }).text).toBe(
            "Done. The tool returned nothing.",
        );
    });
});
