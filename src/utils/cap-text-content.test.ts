import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import capTextContent from "./cap-text-content";

describe("capTextContent", () => {
    test("keeps text under the ceiling as it is", () => {
        expect(capTextContent({ text: "short" })).toBe("short");
    });

    test("keeps exactly the ceiling", () => {
        const text = "a".repeat(AppData.BotAttachmentTextStoreMaxChars);
        expect(capTextContent({ text })).toBe(text);
    });

    test("cuts it and says so", () => {
        const text = "a".repeat(AppData.BotAttachmentTextStoreMaxChars + 500);
        const capped = capTextContent({ text });

        expect(capped.length).toBeLessThanOrEqual(AppData.BotAttachmentTextStoreMaxChars);
        expect(capped.startsWith("a")).toBe(true);
        expect(capped).toContain("Truncated");
        expect(capped).toContain(String(text.length));
    });
});
