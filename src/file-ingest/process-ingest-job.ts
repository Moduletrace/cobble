import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE } from "@/db/types/db";
import ingestBotFile from "@/src/functions/backend/db/bot-files/ingest-bot-file";
import { logError } from "@/src/functions/backend/logger";

type Params = {
    job: BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE;
};

/**
 * Ingests one queued file and completes (or fails) its job. A file that
 * was deleted meanwhile is simply done.
 */
export default async function processIngestJob({ job }: Params) {
    if (!job.id || !job.file_id) return;

    try {
        const result = await ingestBotFile({ file_id: job.file_id });

        await BunSQLite.queue.complete({ table: "file_ingest_queue", id: job.id });

        if (result.status == "ingested") {
            BunSQLite.sql({
                sql: `UPDATE bot_files SET ingest_error = NULL WHERE id = ?`,
                values: [job.file_id],
            }).catch(() => {});
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        await BunSQLite.queue
            .fail({ table: "file_ingest_queue", id: job.id, error: message.slice(0, 500) })
            .catch(() => {});

        await logError({
            title: `Bot file #${job.file_id} couldn't be ingested`,
            error,
            metadata: { file_id: job.file_id },
        }).catch(() => {});
    }
}
