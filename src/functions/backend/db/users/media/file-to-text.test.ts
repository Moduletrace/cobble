import { describe, expect, test } from "bun:test";
import fileToText from "./file-to-text";

function stream({ text }: { text: string }) {
    return Buffer.from(text, "utf-8") as Buffer<ArrayBuffer>;
}

describe("fileToText", () => {
    test("reads the plain text types as they are", async () => {
        for (const file_type of ["txt", "text", "md", "markdown", "csv", "tsv", "json", "html", "htm", "xml", "yml", "yaml", "log"]) {
            expect(await fileToText({ file_type, file_stream: stream({ text: "hello" }) })).toBe("hello");
        }
    });

    test("keeps the real case of the text", async () => {
        expect(await fileToText({ file_type: "md", file_stream: stream({ text: "# Heading\n\nBody" }) })).toBe(
            "# Heading\n\nBody",
        );
    });

    /**
     * The bug this guards: the switch used to fall through to
     * `buffer.toString("utf-8")`, so a zip, an SVG or a spreadsheet was
     * "extracted" as garbled bytes and stored in `media.text_content`.
     */
    test("refuses a binary instead of decoding its bytes", async () => {
        for (const file_type of ["svg", "zip", "xlsx", "pptx", "bin", "exe", ""]) {
            expect(await fileToText({ file_type, file_stream: stream({ text: "PK\u0003\u0004binary" }) })).toBeUndefined();
        }
    });

    test("no buffer is no text", async () => {
        expect(await fileToText({ file_type: "txt" })).toBeUndefined();
    });
});
