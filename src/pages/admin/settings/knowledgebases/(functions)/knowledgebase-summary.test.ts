import { describe, expect, test } from "bun:test";
import knowledgebaseSummary from "./knowledgebase-summary";

const empty = { document_count: 0, pending_count: 0, error_count: 0, stale_count: 0, size: 0 };

describe("knowledgebaseSummary", () => {
    test("an empty knowledgebase says so", () => {
        expect(knowledgebaseSummary({ knowledgebase: empty })).toBe("No documents yet");
    });

    test("counts documents and names only the problems there are", () => {
        expect(knowledgebaseSummary({ knowledgebase: { ...empty, document_count: 1, size: 2048 } })).toBe(
            "1 document · 2.0 KB",
        );
        expect(
            knowledgebaseSummary({
                knowledgebase: { document_count: 3, pending_count: 1, error_count: 1, stale_count: 2, size: 2048 },
            }),
        ).toBe("3 documents · 2.0 KB · 1 being read · 1 couldn't be read · 2 need re-indexing");
    });
});
