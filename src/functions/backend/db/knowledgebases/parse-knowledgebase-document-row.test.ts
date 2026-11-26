import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS } from "@/db/types/db";
import parseKnowledgebaseDocumentRow from "./parse-knowledgebase-document-row";

const parse = ({ media_id }: { media_id?: unknown }) =>
    parseKnowledgebaseDocumentRow({
        row: {
            id: 1,
            knowledgebase_id: 2,
            name: "notes.md",
            source: "file",
            media_id,
        } as BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS,
    });

describe("parseKnowledgebaseDocumentRow", () => {
    test("carries the file's media row, which Open original loads", () => {
        expect(parse({ media_id: 12 }).media_id).toBe(12);
    });

    test("has no media row for a written document or a missing one", () => {
        expect(parse({ media_id: undefined }).media_id).toBeNull();
        expect(parse({ media_id: "" }).media_id).toBeNull();
    });
});