import { describe, expect, test } from "bun:test";
import canExtractText from "./can-extract-text";

describe("canExtractText", () => {
    test("accepts the types the extractor really unpacks", () => {
        for (const name of ["a.pdf", "b.docx", "c.txt", "d.md", "e.csv", "f.tsv", "g.json", "h.html", "i.xml", "j.yml", "k.yaml", "l.log", "m.markdown"]) {
            expect(canExtractText({ name })).toBe(true);
        }
    });

    test("refuses a binary that only has bytes, not text", () => {
        for (const name of ["icon.svg", "bundle.zip", "sheet.xlsx", "slides.pptx", "app.bin", "noext", "archive.tar.gz"]) {
            expect(canExtractText({ name })).toBe(false);
        }
    });

    test("reads the type when the name has no extension", () => {
        expect(canExtractText({ name: "noext", mime_type: "application/pdf" })).toBe(true);
        expect(canExtractText({ name: "noext", mime_type: "image/svg+xml" })).toBe(false);
    });

    test("an octet-stream says nothing, so the name decides", () => {
        expect(canExtractText({ name: "notes.md", mime_type: "application/octet-stream" })).toBe(true);
        expect(canExtractText({ name: "logo.svg", mime_type: "application/octet-stream" })).toBe(false);
    });
});
