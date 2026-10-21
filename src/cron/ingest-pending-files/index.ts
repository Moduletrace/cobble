import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES } from "@/db/types/db";
import enqueueFileIngest from "@/src/file-ingest/enqueue-file-ingest";

/**
 * Queues any bot file that never got ingested (an upload that happened
 * while the worker was down, a restart mid-ingest), so nothing is left
 * unsearchable. Runs every ten minutes.
 */
export default async function ingestPendingFiles() {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT f.id FROM bot_files f
            WHERE f.ingested_at IS NULL
              AND f.ingest_error IS NULL
              AND f.created_at > ?
              AND NOT EXISTS (
                  SELECT 1 FROM file_ingest_queue q
                  WHERE q.file_id = f.id AND q.status IN ('pending', 'processing')
              )
            LIMIT 25`,
        values: [Date.now() - 24 * 60 * 60 * 1000],
    });

    for (const file of res.payload || []) {
        if (file.id) await enqueueFileIngest({ file_id: file.id });
    }

    return res.payload?.length || 0;
}
