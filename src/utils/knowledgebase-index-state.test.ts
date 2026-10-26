import { describe, expect, test } from "bun:test";
import knowledgebaseIndexState from "./knowledgebase-index-state";

const base = { total: 3, indexing: 0, failed: 0, stale: 0, embedding_model: "model" };

describe("knowledgebaseIndexState", () => {
    test("is indexed when every document is read by the current model", () => {
        expect(knowledgebaseIndexState(base)).toBe("indexed");
    });

    test("puts being read before a failure, and a failure before the model", () => {
        expect(knowledgebaseIndexState({ ...base, indexing: 1, failed: 1 })).toBe("indexing");
        expect(knowledgebaseIndexState({ ...base, failed: 1, embedding_model: null })).toBe("failed");
    });

    test("is words only without a model, stale with another one", () => {
        expect(knowledgebaseIndexState({ ...base, stale: 3, embedding_model: null })).toBe("words");
        expect(knowledgebaseIndexState({ ...base, stale: 1 })).toBe("stale");
    });

    test("is empty with no documents", () => {
        expect(knowledgebaseIndexState({ ...base, total: 0, indexing: 1 })).toBe("empty");
    });
});
