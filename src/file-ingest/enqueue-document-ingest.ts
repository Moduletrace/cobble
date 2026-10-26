import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE } from "@/db/types/db";
import wakeFileIngest from "./wake-file-ingest";

type Params = {
    document_id: number | string;
};

/**
 * Queues a knowledgebase document to be chunked and embedded, unless it's
 * already waiting. Never fails the caller: a document that can't be queued
 * is picked up by the `ingest-pending-files` cron instead.
 */
export default async function enqueueDocumentIngest({ document_id }: Params) {
    try {
        const open = await BunSQLite.sql<BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE>({
            sql: `SELECT id FROM file_ingest_queue WHERE document_id = ? AND status = 'pending' LIMIT 1`,
            values: [document_id],
        });

        if (open.payload?.[0]?.id) {
            wakeFileIngest();
            return;
        }

        await BunSQLite.queue.add({
            table: "file_ingest_queue",
            data: [{ document_id: Number(document_id) }],
        });

        wakeFileIngest();
    } catch {
        /**
         * The cron sweeps it up.
         */
    }
}
