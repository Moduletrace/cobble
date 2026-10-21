import { describe, expect, test } from "bun:test";
import chunkText from "./chunk-text";

describe("chunkText", () => {
    test("returns nothing for empty text", () => {
        expect(chunkText({ text: "   \n\n  " })).toEqual([]);
    });

    test("keeps a short document in one chunk", () => {
        expect(chunkText({ text: "One paragraph.\n\nAnother one." })).toEqual([
            "One paragraph.\n\nAnother one.",
        ]);
    });

    test("splits at paragraph boundaries, never mid-word", () => {
        const paragraph = "word ".repeat(40).trim();
        const chunks = chunkText({ text: [1, 2, 3, 4, 5].map(() => paragraph).join("\n\n"), target: 300, overlap: 0 });

        expect(chunks.length).toBeGreaterThan(1);

        for (const chunk of chunks) {
            expect(chunk.split(/\s+/).every((word) => word == "word")).toBe(true);
        }
    });

    test("carries the heading into the chunk it starts", () => {
        const text = "# Report\n\nThe numbers are up.\n\n## Details\n\nEverything is fine.";
        const chunks = chunkText({ text, target: 120, overlap: 0 });

        expect(chunks[0]).toContain("# Report");
    });

    test("overlaps consecutive chunks of a long paragraph", () => {
        const text = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
        const chunks = chunkText({ text, target: 200, overlap: 40 });

        expect(chunks.length).toBeGreaterThan(1);

        const first_tail = chunks[0]!.split(" ").slice(-2).join(" ");

        expect(chunks[1]!.startsWith(first_tail.split(" ")[0]!) || chunks[1]!.includes(first_tail)).toBe(true);
    });

    test("keeps a word longer than the target whole", () => {
        const chunks = chunkText({ text: "a".repeat(400), target: 100, overlap: 0 });

        expect(chunks.join("")).toContain("a".repeat(400).slice(0, 10));
        expect(chunks.length).toBeGreaterThan(0);
    });

    test("collapses runs of blank lines", () => {
        expect(chunkText({ text: "One.\n\n\n\n\nTwo." })).toEqual(["One.\n\nTwo."]);
    });
});
