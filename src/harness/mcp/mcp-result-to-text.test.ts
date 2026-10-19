import { describe, expect, test } from "bun:test";
import mcpResultToText from "./mcp-result-to-text";

describe("mcpResultToText", () => {
    test("joins text parts", async () => {
        expect(
            await mcpResultToText({
                result: {
                    content: [
                        { type: "text", text: "one" },
                        { type: "text", text: "two" },
                    ],
                },
            }),
        ).toBe("one\n\ntwo");
    });

    test("describes images with the given reader", async () => {
        expect(
            await mcpResultToText({
                result: {
                    content: [{ type: "image", data: "aGk=", mimeType: "image/png" }],
                },
                describeImage: async ({ data, mime_type }) =>
                    `${mime_type} ${data}`,
            }),
        ).toBe("[Image: image/png aGk=]");
    });

    test("notes images when nothing can read them", async () => {
        expect(
            await mcpResultToText({
                result: {
                    content: [{ type: "image", data: "aGk=", mimeType: "image/png" }],
                },
            }),
        ).toBe("[Image (image/png)]");
    });

    test("keeps going when an image can't be read", async () => {
        expect(
            await mcpResultToText({
                result: { content: [{ type: "image", data: "aGk=" }] },
                describeImage: async () => {
                    throw new Error("No vision model.");
                },
            }),
        ).toBe("[Image: couldn't be read. No vision model.]");
    });

    test("falls back to structured content", async () => {
        expect(
            await mcpResultToText({
                result: { content: [], structuredContent: { ok: true } },
            }),
        ).toBe(`{"ok":true}`);
    });

    test("throws error results", async () => {
        expect(
            mcpResultToText({
                result: {
                    isError: true,
                    content: [{ type: "text", text: "No such file" }],
                },
            }),
        ).rejects.toThrow("No such file");
    });

    test("says when the tool returned nothing", async () => {
        expect(await mcpResultToText({ result: {} })).toBe(
            "Done. The tool returned nothing.",
        );
    });
});
