import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import planTextContentPrune from "./plan-text-content-prune";

describe("planTextContentPrune", () => {
    test("clears the raw bytes stored for a type the extractor can't read", () => {
        const changes = planTextContentPrune({
            rows: [
                { id: 1, title: "logo.svg", mime_type: "image/svg+xml", text_content: "<svg><path/></svg>" },
                { id: 2, title: "bundle.zip", mime_type: "application/zip", text_content: "PK\u0003\u0004" },
                { id: 3, title: "sheet.xlsx", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", text_content: "PK\u0003\u0004" },
            ],
        });

        expect(changes.map((change) => change.media_id)).toEqual([1, 2, 3]);
        expect(changes.every((change) => change.text_content === null)).toBe(true);
        expect(changes.every((change) => change.after_chars === 0)).toBe(true);
    });

    test("leaves a document's text alone", () => {
        const changes = planTextContentPrune({
            rows: [
                { id: 4, title: "invoice.pdf", mime_type: "application/pdf", text_content: "Total: 12" },
                { id: 5, title: "notes.md", mime_type: "text/markdown", text_content: "# Hi" },
                { id: 6, title: "rows.csv", mime_type: "text/csv", text_content: "a,b\n1,2" },
            ],
        });

        expect(changes).toEqual([]);
    });

    test("cuts a document over the store ceiling", () => {
        const text = "a".repeat(AppData.BotAttachmentTextStoreMaxChars + 100);
        const changes = planTextContentPrune({
            rows: [{ id: 7, title: "long.txt", mime_type: "text/plain", text_content: text }],
        });

        expect(changes).toHaveLength(1);
        expect(changes[0]!.after_chars).toBeLessThanOrEqual(AppData.BotAttachmentTextStoreMaxChars);
        expect(changes[0]!.text_content).toContain("Truncated");
        expect(changes[0]!.before_chars).toBe(text.length);
    });

    test("nothing to say about a row with no text or no id", () => {
        expect(
            planTextContentPrune({
                rows: [
                    { id: 8, title: "empty.pdf", text_content: "" },
                    { id: 9, title: "blank.pdf", text_content: "   \n " },
                    { id: 10, title: "none.pdf" },
                    { title: "no id.pdf", text_content: "text" },
                ],
            }),
        ).toEqual([]);
    });

    test("counting what each change reclaims is left to the caller", () => {
        const changes = planTextContentPrune({
            rows: [{ id: 11, title: "icon.svg", mime_type: "image/svg+xml", text_content: "12345" }],
        });

        expect(changes).toHaveLength(1);
        expect(changes[0]!.before_chars - changes[0]!.after_chars).toBe(5);
    });
});
