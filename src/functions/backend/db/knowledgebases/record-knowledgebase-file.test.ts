import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import { knowledgebaseFileProblem } from "./record-knowledgebase-file";

describe("knowledgebaseFileProblem", () => {
    test("takes a file whose text can be read", () => {
        expect(knowledgebaseFileProblem({ name: "handbook.pdf", size: 1024 })).toBe(null);
        expect(knowledgebaseFileProblem({ name: "notes.md", size: 10 })).toBe(null);
    });

    test("refuses one with no text to read, naming what it takes", () => {
        const problem = knowledgebaseFileProblem({ name: "sheet.xlsx", size: 10 });

        expect(problem).toContain("sheet.xlsx has no text to read");
        expect(problem).toContain("pdf");
    });

    test("refuses an empty file and one past the limit", () => {
        expect(knowledgebaseFileProblem({ name: "a.md", size: 0 })).toContain("is empty");
        expect(knowledgebaseFileProblem({ name: "a.md", size: AppData.KnowledgebaseDocumentMaxBytes + 1 })).toContain(
            "is too big",
        );
        expect(knowledgebaseFileProblem({ name: "a.md", size: AppData.KnowledgebaseDocumentMaxBytes })).toBe(null);
    });

    test("checks the type before the bytes are read", () => {
        expect(knowledgebaseFileProblem({ name: "sheet.xlsx" })).toContain("has no text to read");
        expect(knowledgebaseFileProblem({ name: "notes.md" })).toBe(null);
    });
});