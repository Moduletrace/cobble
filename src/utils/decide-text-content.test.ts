import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import decideTextContent from "./decide-text-content";

describe("decideTextContent", () => {
    test("keeps the text of a document the extractor reads", () => {
        expect(decideTextContent({ name: "invoice.pdf", text: "Total: 12" })).toBe("Total: 12");
        expect(decideTextContent({ name: "notes.md", text: "# Hi" })).toBe("# Hi");
        expect(decideTextContent({ name: "rows.csv", text: "a,b" })).toBe("a,b");
    });

    test("drops the raw bytes of anything else", () => {
        expect(decideTextContent({ name: "icon.svg", text: "<svg>...</svg>" })).toBeNull();
        expect(decideTextContent({ name: "bundle.zip", text: "PK\u0003\u0004binary" })).toBeNull();
        expect(decideTextContent({ name: "sheet.xlsx", text: "PK\u0003\u0004binary" })).toBeNull();
        expect(decideTextContent({ name: "app.bin", text: "\u0000\u0001\u0002" })).toBeNull();
    });

    test("nothing to store is null, not an empty string", () => {
        expect(decideTextContent({ name: "invoice.pdf", text: "" })).toBeNull();
        expect(decideTextContent({ name: "invoice.pdf", text: "   \n  " })).toBeNull();
        expect(decideTextContent({ name: "invoice.pdf" })).toBeNull();
    });

    test("cuts a document over the ceiling", () => {
        const text = "a".repeat(AppData.BotAttachmentTextStoreMaxChars + 10);
        const decided = decideTextContent({ name: "long.txt", text });

        expect(decided).toContain("Truncated");
        expect(decided!.length).toBeLessThanOrEqual(AppData.BotAttachmentTextStoreMaxChars);
    });

    test("a document over the ceiling is still cut when the overflow is small", () => {
        const text = "a".repeat(AppData.BotAttachmentTextStoreMaxChars + 10);
        const decided = decideTextContent({ name: "long.txt", text })!;

        expect(decided).toContain("Truncated");
        expect(decided.length).toBeLessThanOrEqual(AppData.BotAttachmentTextStoreMaxChars);
    });
});
