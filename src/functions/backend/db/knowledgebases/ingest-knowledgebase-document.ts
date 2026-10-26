import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASE_CHUNKS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import embedText from "@/src/harness/embeddings/embed-text";
import HarnessError from "@/src/harness/harness-error";
import runWithFallbackScope from "@/src/harness/usage/run-with-fallback-scope";
import chunkText from "../bot-files/chunk-text";
import ensureKnowledgebaseFts from "./fts/ensure-knowledgebase-fts";
import grabKnowledgebaseDocumentText from "./grab-knowledgebase-document-text";

type Params = {
    document_id: number | string;
    signal?: AbortSignal;
};

export type KnowledgebaseIngestResult = {
    /**
     * `ingested`, `empty` (no text to read), `skipped` (too large) or
     * `words` (no embedding model: searchable by words only).
     */
    status: "ingested" | "empty" | "skipped" | "words" | "missing";
    chunks: number;
};

/**
 * Reads a knowledgebase document's text, splits it into chunks and embeds
 * them with the install's embedding model (never a bot's: every vector in
 * a knowledgebase must be comparable). The old passages stay searchable
 * until the new ones are in. Without an embedding model the chunks are
 * still kept, and indexed for ranked word matching
 * (`knowledgebase_chunks_fts`).
 *
 * Failures are recorded on the document (`ingest_error`) and rethrown, so
 * the queue can retry.
 */
export default async function ingestKnowledgebaseDocument({
    document_id,
    signal,
}: Params): Promise<KnowledgebaseIngestResult> {
    const document = (
        await BunSQLite.sql<{
            id: number;
            knowledgebase_id: number;
            name: string;
            source: string;
            media_id: number | null;
            content: string | null;
            mime_type: string | null;
            size: number;
            user_id: number | null;
        }>({
            sql: `SELECT id, knowledgebase_id, name, source, media_id, content, mime_type, size, user_id
                FROM knowledgebase_documents WHERE id = ? LIMIT 1`,
            values: [document_id],
        })
    ).payload?.[0];

    if (!document?.id) return { status: "missing", chunks: 0 };

    if (Number(document.size) > AppData.KnowledgebaseDocumentMaxBytes) {
        await finish({
            document_id: document.id,
            chunks: 0,
            model: null,
            error: `Too large to read (over ${AppData.KnowledgebaseDocumentMaxBytes / (1024 * 1024)} MB).`,
        });

        return { status: "skipped", chunks: 0 };
    }

    /**
     * The ingest queue has no run behind it: the embedding is charged to
     * whoever added the document, so it shows on the usage page.
     */
    const scope = document.user_id ? { user_id: document.user_id } : null;
    /**
     * Set once the document's outcome is written, so the catch below
     * doesn't write over it.
     */
    let recorded = false;

    try {
        const text = await grabKnowledgebaseDocumentText({ document });

        const old_ids = await chunkIds({ document_id: document.id });
        const chunks = text.trim() ? chunkText({ text }) : [];

        if (!chunks.length) {
            await dropChunks({ ids: old_ids });
            await finish({ document_id: document.id, chunks: 0, model: null, error: "It has no text to read." });

            return { status: "empty", chunks: 0 };
        }

        const new_ids = await insertChunks({ document, chunks });
        let model: string | null = null;

        try {
            for (let start = 0; start < chunks.length; start += AppData.EmbeddingBatchSize) {
                const batch = chunks.slice(start, start + AppData.EmbeddingBatchSize);
                const embedded = await runWithFallbackScope({
                    scope,
                    task: () => embedText({ input: batch, signal }),
                });

                model = embedded.model || model;

                for (let i = 0; i < embedded.vectors.length; i++) {
                    await insertVector({
                        vector: embedded.vectors[i]!,
                        chunk_id: new_ids[start + i]!,
                        document_id: document.id,
                        knowledgebase_id: document.knowledgebase_id,
                    });
                }
            }
        } catch (error) {
            if (!(error instanceof HarnessError) || error.resting) {
                /**
                 * Not the model's answer (a bug, a database error), or no
                 * model was tried yet: the old passages are still whole,
                 * the new ones go, and the job tries again.
                 */
                await dropChunks({ ids: new_ids });
                throw error;
            }

            /**
             * No embedding model, or it refused: the new passages stay,
             * found by their words, and none of their vectors are kept
             * (half a document embedded would rank unevenly).
             */
            await dropVectors({ ids: new_ids });

            if (error.code != "unavailable") {
                await dropChunks({ ids: old_ids });
                await finish({
                    document_id: document.id,
                    chunks: chunks.length,
                    model: null,
                    error: `Found by its words only: the embedding model failed. ${error.message}`.slice(0, 500),
                });
                recorded = true;

                throw error;
            }

            model = null;
        }

        await dropChunks({ ids: old_ids });
        await finish({ document_id: document.id, chunks: chunks.length, model });

        return { status: model ? "ingested" : "words", chunks: chunks.length };
    } catch (error) {
        /**
         * Every model resting: nothing was tried, the job waits for them
         * and the document keeps what it said before.
         */
        if (recorded || (error instanceof HarnessError && error.resting)) throw error;

        const message = error instanceof Error ? error.message : String(error);

        await BunSQLite.sql({
            sql: `UPDATE knowledgebase_documents SET ingest_error = ?, updated_at = ? WHERE id = ?`,
            values: [message.slice(0, 500), Date.now(), document.id],
        }).catch(() => {});

        throw error;
    }
}

async function chunkIds({ document_id }: { document_id: number }) {
    const res = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM knowledgebase_chunks WHERE document_id = ?`,
        values: [document_id],
    });

    return (res.payload || []).map((row) => Number(row.id));
}

async function dropVectors({ ids }: { ids: number[] }) {
    for (let start = 0; start < ids.length; start += 500) {
        const batch = ids.slice(start, start + 500);

        await BunSQLite.sql({
            sql: `DELETE FROM knowledgebase_vectors WHERE chunk_id IN (${batch.map(() => "?").join(", ")})`,
            values: batch,
        });
    }
}

async function dropChunks({ ids }: { ids: number[] }) {
    for (let start = 0; start < ids.length; start += 500) {
        const batch = ids.slice(start, start + 500);
        const placeholders = batch.map(() => "?").join(", ");

        await BunSQLite.sql({ sql: `DELETE FROM knowledgebase_vectors WHERE chunk_id IN (${placeholders})`, values: batch });
        await BunSQLite.sql({
            sql: `DELETE FROM knowledgebase_chunks_fts WHERE chunk_id IN (${placeholders})`,
            values: batch,
        });
        await BunSQLite.sql({ sql: `DELETE FROM knowledgebase_chunks WHERE id IN (${placeholders})`, values: batch });
    }
}

async function insertChunks({
    document,
    chunks,
}: {
    document: { id: number; knowledgebase_id: number };
    chunks: string[];
}) {
    const ids: number[] = [];

    await ensureKnowledgebaseFts();

    for (let index = 0; index < chunks.length; index++) {
        const text = chunks[index]!;

        const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_KNOWLEDGEBASE_CHUNKS, (typeof BunSQLiteTables)[number]>({
            table: "knowledgebase_chunks",
            data: [
                {
                    document_id: document.id,
                    knowledgebase_id: Number(document.knowledgebase_id),
                    chunk_index: index,
                    text,
                    token_estimate: Math.ceil(text.length / 4),
                },
            ],
        });

        const id = res.postInsertReturn?.insertId;

        if (!res.success || !id) throw new Error(`Couldn't store a passage: ${res.msg || res.error}`);

        ids.push(Number(id));

        /**
         * Its words go in the full-text index, which ranks a word search.
         */
        const indexed = await BunSQLite.sql({
            sql: `INSERT INTO knowledgebase_chunks_fts (text, chunk_id, document_id, knowledgebase_id) VALUES (?, ?, ?, ?)`,
            values: [text, Number(id), document.id, Number(document.knowledgebase_id)],
        });

        if (!indexed.success) throw new Error(`Couldn't index a passage: ${indexed.error || indexed.msg}`);
    }

    return ids;
}

async function insertVector({
    vector,
    chunk_id,
    document_id,
    knowledgebase_id,
}: {
    vector: Float32Array;
    chunk_id: number;
    document_id: number;
    knowledgebase_id: number;
}) {
    /**
     * vec0's metadata columns (its id and timestamps) are NOT NULL, so a
     * raw insert fills them; the vector needs `vec_f32`.
     */
    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `INSERT INTO knowledgebase_vectors (created_at, updated_at, embedding, chunk_id, document_id, knowledgebase_id) VALUES (?, ?, vec_f32(?), ?, ?, ?)`,
        values: [now, now, vector as any, chunk_id, document_id, knowledgebase_id],
    });

    if (!res.success) throw new Error(`Couldn't store an embedding: ${res.error || res.msg}`);
}

async function finish({
    document_id,
    chunks,
    model,
    error,
}: {
    document_id: number;
    chunks: number;
    model: string | null;
    error?: string;
}) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE knowledgebase_documents SET ingested_at = ?, chunk_count = ?, embedding_model = ?, ingest_error = ?,
                updated_at = ? WHERE id = ?`,
        values: [now, chunks, model, error || null, now, document_id],
    });
}
