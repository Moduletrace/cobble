import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import { embedQuery } from "@/src/harness/embeddings/embed-text";
import HarnessError from "@/src/harness/harness-error";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    scopes: StorageScope[];
    query: string;
    /**
     * Only this file's chunks.
     */
    file_id?: number | string | null;
    limit?: number;
    signal?: AbortSignal;
    /**
     * Whose embedding model to use.
     */
    bot_id?: number | string;
    workspace_id?: number | string | null;
};

export type BotFileSearchHit = {
    file_id: number;
    chunk_id: number;
    chunk_index: number;
    name: string;
    path: string;
    scope: string;
    /**
     * Cosine distance when the vector index answered, null for a word
     * match.
     */
    distance: number | null;
    text: string;
};

export type BotFileSearchResult = {
    hits: BotFileSearchHit[];
    /**
     * How the search ran: `vector`, `words` (no embedding model, or nothing
     * matched) or `none` (no files at all).
     */
    mode: "vector" | "words" | "none";
    /**
     * Said plainly for the bot's own reading of what it got back.
     */
    note: string;
};

/**
 * Searches a run's files: by meaning through the embedding vectors when a
 * model is set, else (or when nothing matches) by words over the stored
 * chunks. Never throws for an unavailable model: the bot always gets
 * something it can act on.
 */
export default async function searchBotFiles({
    scopes,
    query,
    file_id,
    limit = AppData.RagTopChunks,
    signal,
    bot_id,
    workspace_id,
}: Params): Promise<BotFileSearchResult> {
    const text = query.trim();

    if (!scopes.length || !text) {
        return { hits: [], mode: "none", note: "No files to search." };
    }

    try {
        const vector = await embedQuery({
            text,
            signal,
            bot_id,
            workspace_id,
        });

        const hits = await vectorSearch({
            scopes,
            query_vector: vector,
            file_id,
            limit,
            seek: Math.min(limit * AppData.RagOverFetch, AppData.RagMaxK),
        });

        if (hits.length) {
            return {
                hits,
                mode: "vector",
                note: `${hits.length} passage(s), found by meaning.`,
            };
        }
    } catch (error) {
        if (!(error instanceof HarnessError)) throw error;
    }

    const hits = await wordSearch({ scopes, query: text, file_id, limit });

    return {
        hits,
        mode: hits.length ? "words" : "none",
        note: hits.length
            ? `${hits.length} passage(s), found by matching words (no embedding model, or nothing matched by meaning).`
            : `Nothing in your files matched "${text}".`,
    };
}

/**
 * The nearest chunks by vector. sqlite-vec refuses a filter on a vec0
 * side-car column in the same query as the match, so the index is asked
 * for its nearest `seek` and the run's scopes are applied to that list
 * here, before the chunk text is read.
 */
async function vectorSearch({
    scopes,
    query_vector,
    file_id,
    limit,
    seek,
}: {
    scopes: StorageScope[];
    query_vector: Float32Array;
    file_id?: number | string | null;
    limit: number;
    seek: number;
}): Promise<BotFileSearchHit[]> {
    const nearest = await BunSQLite.sql<{
        chunk_id: number;
        file_id: number;
        scope: string;
        owner_id: number;
        distance: number;
    }>({
        sql: `SELECT chunk_id, file_id, scope, owner_id, distance FROM bot_file_vectors WHERE embedding MATCH vec_f32(?) AND k = ? ORDER BY distance`,
        values: [query_vector as any, seek],
    });

    /**
     * `BunSQLite.sql` resolves with `success: false` instead of throwing, so
     * a broken vector query would otherwise read as "nothing matched" and
     * silently fall back to words. A failure here is a real error.
     */
    if (!nearest.success) {
        throw new Error(`The file search index couldn't be read: ${nearest.error || nearest.msg}`);
    }

    const allowed = nearest.payload?.filter((row) =>
        scopes.some((scope) => scope.scope == row.scope && Number(scope.owner_id) == Number(row.owner_id)),
    );

    const picked = (allowed || [])
        .filter((row) => !file_id || Number(row.file_id) == Number(file_id))
        .slice(0, limit);

    if (!picked.length) return [];

    const chunk_ids = picked.map((row) => Number(row.chunk_id));
    const placeholders = chunk_ids.map(() => "?").join(", ");

    const chunks = await BunSQLite.sql<{
        id: number;
        text: string;
        chunk_index: number;
        name: string;
        path: string;
    }>({
        sql: `SELECT c.id, c.text, c.chunk_index, f.name, f.path FROM bot_file_chunks c
            JOIN bot_files f ON f.id = c.file_id
            WHERE c.id IN (${placeholders})`,
        values: chunk_ids,
    });

    const by_id = new Map((chunks.payload || []).map((row) => [Number(row.id), row]));

    return picked.flatMap((row) => {
        const chunk = by_id.get(Number(row.chunk_id));

        if (!chunk) return [];

        return [
            toHit({
                chunk_id: row.chunk_id,
                file_id: row.file_id,
                scope: row.scope,
                distance: Number(row.distance),
                text: chunk.text,
                chunk_index: chunk.chunk_index,
                name: chunk.name,
                path: chunk.path,
            }),
        ];
    });
}

/**
 * Chunks whose text has the query's words, newest files first. Used when
 * there's no embedding model, and as the fallback when the vectors
 * answered nothing.
 */
async function wordSearch({
    scopes,
    query,
    file_id,
    limit,
}: {
    scopes: StorageScope[];
    query: string;
    file_id?: number | string | null;
    limit: number;
}): Promise<BotFileSearchHit[]> {
    const words = [
        ...new Set(
            query
                .toLowerCase()
                .split(/[^a-z0-9]+/)
                .filter((word) => word.length > 2),
        ),
    ].slice(0, 6);

    if (!words.length) return [];

    const scope_sql = scopes.map(() => `(c.scope = ? AND c.owner_id = ?)`).join(" OR ");
    const scope_values = scopes.flatMap((s) => [s.scope, s.owner_id]);
    const word_sql = words.map(() => `lower(c.text) LIKE ?`).join(" OR ");
    const word_values = words.map((word) => `%${word}%`);
    const file_clause = file_id ? "AND c.file_id = ?" : "";

    const res = await BunSQLite.sql<{
        chunk_id: number;
        file_id: number;
        text: string;
        chunk_index: number;
        name: string;
        path: string;
        scope: string;
    }>({
        sql: `SELECT c.id AS chunk_id, c.file_id, c.text, c.chunk_index, c.scope, f.name, f.path
            FROM bot_file_chunks c
            JOIN bot_files f ON f.id = c.file_id
            WHERE (${scope_sql}) ${file_clause} AND (${word_sql})
            ORDER BY f.updated_at DESC, c.chunk_index
            LIMIT ?`,
        values: [...scope_values, ...(file_id ? [file_id] : []), ...word_values, limit],
    });

    return (res.payload || []).map((row) => toHit({ ...row, distance: null }));
}

function toHit(row: {
    chunk_id: number;
    file_id: number;
    text: string;
    chunk_index: number;
    name: string;
    path: string;
    scope: string;
    distance: number | null;
}): BotFileSearchHit {
    return {
        file_id: Number(row.file_id),
        chunk_id: Number(row.chunk_id),
        chunk_index: Number(row.chunk_index),
        name: row.name || "",
        path: row.path || "",
        scope: row.scope || "bot",
        distance: row.distance == null ? null : Number(row.distance),
        text: row.text || "",
    };
}
