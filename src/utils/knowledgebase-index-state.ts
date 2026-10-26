export type KnowledgebaseIndexState = "empty" | "indexing" | "failed" | "words" | "stale" | "indexed";

type Params = {
    /**
     * Documents in all, and how many are being read, went wrong, or were
     * read by another embedding model (or by words only).
     */
    total: number;
    indexing: number;
    failed: number;
    stale: number;
    /**
     * The install's embedding model, null when there's none.
     */
    embedding_model: string | null;
};

/**
 * How far a knowledgebase (or one document) is indexed, the first that
 * holds: nothing in it, still being read, something went wrong, no
 * embedding model (found by words only), read by another model, or
 * every document searchable by meaning.
 */
export default function knowledgebaseIndexState({
    total,
    indexing,
    failed,
    stale,
    embedding_model,
}: Params): KnowledgebaseIndexState {
    if (!total) return "empty";
    if (indexing) return "indexing";
    if (failed) return "failed";
    if (!embedding_model) return "words";
    if (stale) return "stale";

    return "indexed";
}
