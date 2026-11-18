import { describe, expect, test } from "bun:test";
import resolveKnowledgebaseDocumentSource from "./knowledgebase-document-source";

describe("resolveKnowledgebaseDocumentSource", () => {
    test("names each source", () => {
        expect(resolveKnowledgebaseDocumentSource({ args: { file_id: 4 } })).toEqual({ source: "file" });
        expect(resolveKnowledgebaseDocumentSource({ args: { media_id: 7 } })).toEqual({ source: "media" });
        expect(resolveKnowledgebaseDocumentSource({ args: { path: "downloads/a.pdf" } })).toEqual({ source: "path" });
        expect(resolveKnowledgebaseDocumentSource({ args: { text: "# Notes" } })).toEqual({ source: "text" });
    });

    test("needs exactly one source", () => {
        expect(resolveKnowledgebaseDocumentSource({ args: {} })).toHaveProperty("problem");
        expect(resolveKnowledgebaseDocumentSource({ args: { file_id: 1, media_id: 2 } })).toHaveProperty("problem");
        expect(resolveKnowledgebaseDocumentSource({ args: { path: "a.pdf", text: "b" } })).toHaveProperty("problem");
    });

    test("rewrites text only", () => {
        expect(resolveKnowledgebaseDocumentSource({ args: { document_id: 3 } })).toHaveProperty("problem");
        expect(resolveKnowledgebaseDocumentSource({ args: { document_id: 3, text: "new" } })).toEqual({
            source: "text",
        });
        expect(resolveKnowledgebaseDocumentSource({ args: { document_id: 3, file_id: 2 } })).toHaveProperty("problem");
    });
});