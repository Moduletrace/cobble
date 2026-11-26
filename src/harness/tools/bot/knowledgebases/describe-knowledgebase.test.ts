import { describe, expect, test } from "bun:test";
import type { KnowledgebaseDocument, PublicKnowledgebase } from "@/src/types";
import describeKnowledgebase from "./describe-knowledgebase";

const knowledgebase: PublicKnowledgebase = {
    id: 3,
    name: "Handbook",
    description: "How we work",
    enabled: true,
    updated_at: Date.now(),
    access: { all_bots: false, bot_ids: [7], workspace_ids: [] },
    document_count: 2,
    pending_count: 1,
    error_count: 0,
    warning_count: 0,
    stale_count: 1,
    size: 4096,
};

const document: KnowledgebaseDocument = {
    id: 11,
    knowledgebase_id: 3,
    name: "leave.md",
    source: "file",
    media_id: null,
    mime_type: "md",
    size: 2048,
    chunk_count: 4,
    embedding_model: "text-embedding-3-small",
    ingested_at: Date.now(),
    ingest_error: null,
    indexing: false,
    created_at: Date.now(),
};

describe("describeKnowledgebase", () => {
    test("says who reaches it and how much is searchable", () => {
        const text = describeKnowledgebase({ knowledgebase });

        expect(text).toContain("Handbook");
        expect(text).toContain("[bot:7]");
        expect(text).toContain("1 not read yet");
        expect(text).not.toContain("retry_failed_documents");
        expect(text).toContain("re-indexing fixes it");
    });

    test("marks one that's off", () => {
        expect(describeKnowledgebase({ knowledgebase: { ...knowledgebase, enabled: false } })).toContain(
            "no bot can search it",
        );
    });

    test("names the retry for ones that failed", () => {
        const text = describeKnowledgebase({ knowledgebase: { ...knowledgebase, error_count: 2 } });

        expect(text).toContain("2 failed (retry_failed_documents reads those again)");
    });

    test("lists documents and says one failed", () => {
        const text = describeKnowledgebase({
            knowledgebase,
            documents: [{ ...document, ingest_error: "no text" }],
        });

        expect(text).toContain("#11 leave.md");
        expect(text).toContain("failed: no text");
    });

    test("says when there are none", () => {
        expect(describeKnowledgebase({ knowledgebase: { ...knowledgebase, document_count: 0 }, documents: [] })).toContain(
            "No documents yet.",
        );
    });
});