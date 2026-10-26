import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_FILE_CHUNKS,
    BUN_SQLITE_COBBLE_BOT_FILES,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import embedText from "@/src/harness/embeddings/embed-text";
import HarnessError from "@/src/harness/harness-error";
import { grabHarnessUsageScope } from "@/src/harness/usage/harness-usage-scope";
import type { HarnessUsageScope } from "@/src/harness/usage/types";
import runWithFallbackScope from "@/src/harness/usage/run-with-fallback-scope";
import grabUsageOwnerUserId from "@/src/functions/backend/db/usage/grab-usage-owner";
import chunkText from "./chunk-text";
import extractBotFileText from "./extract-bot-file-text";

type Params = {
    file_id: number | string;
    /**
     * Read images and audio too (a bot asking for it).
     */
    read_media?: boolean;
    signal?: AbortSignal;
};

export type IngestResult = {
    /**
     * `ingested`, `empty` (no text to read), `skipped` (too large) or
     * `unavailable` (no embedding model), which keeps the file's text but
     * leaves it searchable by words only.
     */
    status: "ingested" | "empty" | "skipped" | "unavailable";
    chunks: number;
};

/**
 * Reads a bot file's text, splits it into chunks and embeds them into
 * `bot_file_vectors`, replacing whatever was stored before. The chunks
 * stay in `bot_file_chunks` even when there's no embedding model, so a
 * search can still match words in them.
 *
 * Failures are recorded on the file (`ingest_error`) and rethrown, so the
 * queue can retry.
 */
export default async function ingestBotFile({
    file_id,
    read_media,
    signal,
}: Params): Promise<IngestResult> {
    const file = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT * FROM bot_files WHERE id = ? LIMIT 1`,
        values: [file_id],
    }).then((res) => res.payload?.[0]);

    if (!file?.id) return { status: "empty", chunks: 0 };

    const media = file.media_id
        ? await BunSQLite.sql<{ media_write_path?: string; text_content?: string }>({
              sql: `SELECT media_write_path, text_content FROM media WHERE id = ? LIMIT 1`,
              values: [file.media_id],
          }).then((res) => res.payload?.[0])
        : undefined;

    /**
     * Decided on the file's size alone. A cached `text_content` is not a
     * reason to read an oversized file: it was only ever a slice of it,
     * and taking it as the whole document made a file too big to unpack
     * look already read.
     */
    if (Number(file.size) > AppData.IngestMaxBytes) {
        await BunSQLite.sql({
            sql: `UPDATE bot_files SET ingest_error = ?, updated_at = ? WHERE id = ?`,
            values: [`Too large to read (over ${AppData.IngestMaxBytes / (1024 * 1024)} MB).`, Date.now(), file.id],
        });

        return { status: "skipped", chunks: 0 };
    }

    /**
     * A bot's own run already carries its user. The ingest queue has no run
     * behind it, so everything this file costs - reading an image or an
     * audio file, embedding its chunks - is entered under the owner's scope
     * instead: it spends real tokens and must show on the usage page.
     */
    const owner_scope: HarnessUsageScope | null = grabHarnessUsageScope()?.user_id
        ? null
        : await resolveOwnerScope({ file });

    try {
        const text = await runWithFallbackScope({
            scope: owner_scope,
            task: () =>
                extractBotFileText({
                    write_path: media?.media_write_path,
                    text_content: media?.text_content,
                    name: file.name,
                    mime_type: file.mime_type,
                    read_media,
                }),
        });

        await clearChunks({ file_id: file.id });

        if (!text?.trim()) {
            await markIngested({ file_id: file.id, chunks: 0 });

            return { status: "empty", chunks: 0 };
        }

        const chunks = chunkText({ text });

        if (!chunks.length) {
            await markIngested({ file_id: file.id, chunks: 0 });

            return { status: "empty", chunks: 0 };
        }

        const chunk_ids = await insertChunks({ file, chunks });
        let embedded = 0;

        try {
            /**
             * A big file's chunks go in batches, so one provider refusal
             * doesn't throw away the whole file.
             */
            for (let start = 0; start < chunks.length; start += AppData.EmbeddingBatchSize) {
                const batch = chunks.slice(start, start + AppData.EmbeddingBatchSize);
                const { vectors } = await runEmbed({
                    scope: owner_scope,
                    signal,
                    file,
                    batch,
                });

                for (let i = 0; i < vectors.length; i++) {
                    await insertVector({
                        vector: vectors[i]!,
                        chunk_id: chunk_ids[start + i]!,
                        file_id: file.id,
                        scope: String(file.scope),
                        owner_id: Number(file.owner_id),
                    });

                    embedded++;
                }
            }
        } catch (error) {
            if (error instanceof HarnessError && error.code == "unavailable") {
                /**
                 * No embedding model: the chunks still let a search match
                 * words, so the file isn't a failure.
                 */
                await markIngested({
                    file_id: file.id,
                    chunks: chunks.length,
                    error: "No embedding model is set, so this file is searchable by words only.",
                });

                return { status: "unavailable", chunks: chunks.length };
            }

            throw error;
        }

        await markIngested({ file_id: file.id, chunks: chunks.length });

        return { status: "ingested", chunks: embedded };
    } catch (error) {
        /**
         * Every model resting means nothing was tried: the job waits for
         * them, and the file keeps whatever it said before.
         */
        if (error instanceof HarnessError && error.resting) throw error;

        const message = error instanceof Error ? error.message : String(error);

        await BunSQLite.sql({
            sql: `UPDATE bot_files SET ingest_error = ?, updated_at = ? WHERE id = ?`,
            values: [message.slice(0, 500), Date.now(), file.id],
        }).catch(() => {});

        throw error;
    }
}

async function clearChunks({ file_id }: { file_id: number }) {
    await BunSQLite.sql({ sql: `DELETE FROM bot_file_vectors WHERE file_id = ?`, values: [file_id] });
    await BunSQLite.sql({ sql: `DELETE FROM bot_file_chunks WHERE file_id = ?`, values: [file_id] });
}

async function insertChunks({
    file,
    chunks,
}: {
    file: BUN_SQLITE_COBBLE_BOT_FILES;
    chunks: string[];
}) {
    const ids: number[] = [];

    for (let index = 0; index < chunks.length; index++) {
        const text = chunks[index]!;

        const res = await BunSQLite.insert<
            BUN_SQLITE_COBBLE_BOT_FILE_CHUNKS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "bot_file_chunks",
            data: [
                {
                    file_id: file.id,
                    scope: file.scope as any,
                    owner_id: Number(file.owner_id),
                    chunk_index: index,
                    text,
                    token_estimate: Math.ceil(text.length / 4),
                },
            ],
        });

        const id = res.postInsertReturn?.insertId;

        if (id) ids.push(id);
    }

    return ids;
}

async function insertVector({
    vector,
    chunk_id,
    file_id,
    scope,
    owner_id,
}: {
    vector: Float32Array;
    chunk_id: number;
    file_id: number;
    scope: string;
    owner_id: number;
}) {
    /**
     * vec0's metadata columns (its id and timestamps) are NOT NULL, so a
     * raw insert has to fill them; `BunSQLite.insert` would add them but
     * the vector needs `vec_f32`.
     */
    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `INSERT INTO bot_file_vectors (created_at, updated_at, embedding, chunk_id, file_id, scope, owner_id) VALUES (?, ?, vec_f32(?), ?, ?, ?, ?)`,
        values: [now, now, vector as any, chunk_id, file_id, scope, owner_id],
    });

    if (!res.success) {
        throw new Error(`Couldn't store an embedding: ${res.error || res.msg}`);
    }
}

async function markIngested({
    file_id,
    chunks,
    error,
}: {
    file_id: number;
    chunks: number;
    error?: string;
}) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE bot_files SET ingested_at = ?, ingest_error = ?, updated_at = ? WHERE id = ?`,
        values: [now, error || null, now, file_id],
    });

    await BunSQLite.sql({
        sql: `UPDATE media SET is_rag_ingested = ?, updated_at = ? WHERE id = (SELECT media_id FROM bot_files WHERE id = ?)`,
        values: [chunks > 0 ? 1 : 0, now, file_id],
    }).catch(() => {});
}

/**
 * One batch of a file's chunks, embedded under whatever attribution owns
 * it: the run that asked for the ingest, else the file's owner.
 */
async function runEmbed({
    scope,
    signal,
    file,
    batch,
}: {
    scope: HarnessUsageScope | null;
    signal?: AbortSignal;
    file: BUN_SQLITE_COBBLE_BOT_FILES;
    batch: string[];
}) {
    return await runWithFallbackScope({
        scope,
        task: () =>
            embedText({
                input: batch,
                bot_id: file.bot_id!,
                workspace_id: file.scope == "workspace" ? file.owner_id : null,
                signal,
            }),
    });
}

/**
 * The attribution a file the queue ingests reports under: its workspace's
 * creator when it shares one, else its bot's.
 */
async function resolveOwnerScope({
    file,
}: {
    file: BUN_SQLITE_COBBLE_BOT_FILES;
}): Promise<HarnessUsageScope | null> {
    const workspace_id = file.scope == "workspace" ? file.owner_id : null;
    const user_id = await grabUsageOwnerUserId({ bot_id: file.bot_id, workspace_id });

    if (!user_id) return null;

    return {
        user_id,
        bot_id: file.scope == "bot" ? file.owner_id : file.bot_id,
        workspace_id,
        session_id: null,
        message_id: null,
        job_id: null,
    };
}
