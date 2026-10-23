import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import sanitizeMediaRowTextContent from "./sanitize-media-row-text-content";

describe("sanitizeMediaRowTextContent", () => {
    test("keeps a document's text", () => {
        const row = sanitizeMediaRowTextContent({
            row: { title: "invoice.pdf", mime_type: "application/pdf", text_content: "Total: 12" },
        });

        expect(row.text_content).toBe("Total: 12");
    });

    test("refuses raw bytes typed into a row that names a binary", () => {
        const row = sanitizeMediaRowTextContent({
            row: { title: "logo.svg", mime_type: "image/svg+xml", text_content: "<svg/>" },
        });

        expect(row.text_content).toBeUndefined();
    });

    test("an update is judged on the file it already is", () => {
        const row = sanitizeMediaRowTextContent({
            row: { text_content: "PK\u0003\u0004" },
            existing: { title: "bundle.zip", mime_type: "application/zip" },
        });

        expect(row.text_content).toBeUndefined();
    });

    test("an update with no text is left as it is", () => {
        const row = sanitizeMediaRowTextContent({
            row: { title: "renamed.pdf" },
            existing: { title: "invoice.pdf" },
        });

        expect(row).toEqual({ title: "renamed.pdf" });
    });

    test("a long text without a name is still cut, not dropped", () => {
        const text = "a".repeat(AppData.BotAttachmentTextStoreMaxChars + 10);
        const row = sanitizeMediaRowTextContent({ row: { text_content: text } });

        expect(row.text_content).toContain("Truncated");
        expect(row.text_content!.length).toBeLessThanOrEqual(AppData.BotAttachmentTextStoreMaxChars);
    });

    test("empty text becomes unset", () => {
        const row = sanitizeMediaRowTextContent({ row: { title: "a.pdf", text_content: "" } });

        expect(row.text_content).toBeUndefined();
    });
});
