import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import { embedQuery } from "@/src/harness/embeddings/embed-text";
import HarnessError from "@/src/harness/harness-error";
import knowledgebaseWordQuery from "@/src/utils/knowledgebase-word-query";
import ensureKnowledgebaseFts from "./fts/ensure-knowledgebase-fts";

type Params = {
    /**
     * The knowledgebases the run reaches: nothing outside them is returned.
     */
    knowledgebase_ids: number[];
    query: string;
    /**
     * Only this document's passages.
     */
    document_id?: number | null;
    limit?: number;
    signal?: AbortSignal;
};

export type KnowledgebaseSearchHit = {
    knowledgebase_id: number;
    document_id: number;
    chunk_id: number;
    chunk_index: number;
    document_name: string;
    /**
     * Cosine distance when the vector index answered, null for a word
     * match.
     */
    distance: number | null;
    text: string;
};

export type KnowledgebaseSearchResult = {
    hits: KnowledgebaseSearchHit[];
    mode: "vector" | "words" | "none";
    /**
     * Said plainly for the bot's own reading of what it got back.
     */
    note: string;
};

/**
 * Searches knowledgebases: by meaning through the install's embedding
 * model, else (or when nothing matches) by words over the stored passages.
 * Never throws for an unavailable model.
 */
export default async function searchKnowledgebases({
    knowledgebase_ids,
    query,
    document_id,
    limit = AppData.RagTopChunks,
    signal,
}: Params): Promise<KnowledgebaseSearchResult> {
    const text = query.trim();
    const ids = [...new Set(knowledgebase_ids.map(Number).filter(Boolean))];

    if (!ids.length || !text) {
        return { hits: [], mode: "none", note: "No knowledgebase to search." };
    }

    try {
        const vector = await embedQuery({ text, signal });

        const hits = await vectorSearch({
            ids,
            query_vector: vector,
            document_id,
            limit,
            seek: Math.min(limit * AppData.RagOverFetch, AppData.RagMaxK),
        });

        if (hits.length) {
            return { hits, mode: "vector", note: `${hits.length} passage(s), found by meaning.` };
        }
    } catch (error) {
        if (!(error instanceof HarnessError)) throw error;
    }

    const hits = await wordSearch({ ids, query: text, document_id, limit });

    return {
        hits,
        mode: hits.length ? "words" : "none",
        note: hits.length
            ? `${hits.length} passage(s), found by matching words (no embedding model, or nothing matched by meaning).`
            : `Nothing in the knowledgebase matched "${text}".`,
    };
}

/**
 * The nearest passages by vector. sqlite-vec refuses a filter on a vec0
 * side-car column in the same query as the match, so the index is asked
 * for its nearest `seek` and the run's knowledgebases are applied here.
 */
async function vectorSearch({
    ids,
    query_vector,
    document_id,
    limit,
    seek,
}: {
    ids: number[];
    query_vector: Float32Array;
    document_id?: number | null;
    limit: number;
    seek: number;
}): Promise<KnowledgebaseSearchHit[]> {
    const nearest = await BunSQLite.sql<{
        chunk_id: number;
        document_id: number;
        knowledgebase_id: number;
        distance: number;
    }>({
        sql: `SELECT chunk_id, document_id, knowledgebase_id, distance FROM knowledgebase_vectors
            WHERE embedding MATCH vec_f32(?) AND k = ? ORDER BY distance`,
        values: [query_vector as any, seek],
    });

    if (!nearest.success) {
        throw new Error(`The knowledgebase index couldn't be read: ${nearest.error || nearest.msg}`);
    }

    const picked = (nearest.payload || [])
        .filter((row) => ids.includes(Number(row.knowledgebase_id)))
        .filter((row) => !document_id || Number(row.document_id) == Number(document_id))
        .slice(0, limit);

    if (!picked.length) return [];

    const chunk_ids = picked.map((row) => Number(row.chunk_id));
    const chunks = await BunSQLite.sql<{ id: number; text: string; chunk_index: number; name: string }>({
        sql: `SELECT c.id, c.text, c.chunk_index, d.name FROM knowledgebase_chunks c
            JOIN knowledgebase_documents d ON d.id = c.document_id
            WHERE c.id IN (${chunk_ids.map(() => "?").join(", ")})`,
        values: chunk_ids,
    });

    const by_id = new Map((chunks.payload || []).map((row) => [Number(row.id), row]));

    return picked.flatMap((row) => {
        const chunk = by_id.get(Number(row.chunk_id));

        if (!chunk) return [];

        return [
            {
                knowledgebase_id: Number(row.knowledgebase_id),
                document_id: Number(row.document_id),
                chunk_id: Number(row.chunk_id),
                chunk_index: Number(chunk.chunk_index),
                document_name: chunk.name || "",
                distance: Number(row.distance),
                text: chunk.text || "",
            },
        ];
    });
}

/**
 * Passages by their words: ranked by the full-text index (BM25, so a rare
 * word counts for more than a common one), else, when it finds nothing
 * (text written without spaces, a word cut differently), by the most
 * substrings they hold.
 */
async function wordSearch({
    ids,
    query,
    document_id,
    limit,
}: {
    ids: number[];
    query: string;
    document_id?: number | null;
    limit: number;
}): Promise<KnowledgebaseSearchHit[]> {
    const { match, like_terms } = knowledgebaseWordQuery({ query });
    const in_ids = ids.map(() => "?").join(", ");

    if (match) {
        await ensureKnowledgebaseFts();

        const res = await BunSQLite.sql<HitRow>({
            sql: `SELECT c.knowledgebase_id, c.document_id, c.id AS chunk_id, c.chunk_index, d.name, c.text
                FROM knowledgebase_chunks_fts f
                JOIN knowledgebase_chunks c ON c.id = f.chunk_id
                JOIN knowledgebase_documents d ON d.id = c.document_id
                WHERE knowledgebase_chunks_fts MATCH ?
                  AND f.knowledgebase_id IN (${in_ids})
                  ${document_id ? "AND f.document_id = ?" : ""}
                ORDER BY bm25(knowledgebase_chunks_fts)
                LIMIT ?`,
            values: [match, ...ids, ...(document_id ? [document_id] : []), limit],
        });

        if (!res.success) {
            throw new Error(`The knowledgebase word index couldn't be read: ${res.error || res.msg}`);
        }

        if (res.payload?.length) return res.payload.map(toHit);
    }

    if (!like_terms.length) return [];

    const score = like_terms.map(() => `(CASE WHEN lower(c.text) LIKE ? THEN 1 ELSE 0 END)`).join(" + ");
    const like_values = like_terms.map((term) => `%${term}%`);

    const res = await BunSQLite.sql<HitRow>({
        sql: `SELECT c.knowledgebase_id, c.document_id, c.id AS chunk_id, c.chunk_index, d.name, c.text,
                (${score}) AS score
            FROM knowledgebase_chunks c
            JOIN knowledgebase_documents d ON d.id = c.document_id
            WHERE c.knowledgebase_id IN (${in_ids})
              ${document_id ? "AND c.document_id = ?" : ""}
              AND (${like_terms.map(() => `lower(c.text) LIKE ?`).join(" OR ")})
            ORDER BY score DESC, d.updated_at DESC, c.chunk_index
            LIMIT ?`,
        values: [...like_values, ...ids, ...(document_id ? [document_id] : []), ...like_values, limit],
    });

    return (res.payload || []).map(toHit);
}

type HitRow = {
    knowledgebase_id: number;
    document_id: number;
    chunk_id: number;
    chunk_index: number;
    name: string;
    text: string;
};

function toHit(row: HitRow): KnowledgebaseSearchHit {
    return {
        knowledgebase_id: Number(row.knowledgebase_id),
        document_id: Number(row.document_id),
        chunk_id: Number(row.chunk_id),
        chunk_index: Number(row.chunk_index),
        document_name: row.name || "",
        distance: null,
        text: row.text || "",
    };
}
