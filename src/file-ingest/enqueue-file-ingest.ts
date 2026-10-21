import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE } from "@/db/types/db";
import wakeFileIngest from "./wake-file-ingest";

type Params = {
    file_id: number | string;
};

/**
 * Queues a file to be chunked and embedded, unless it's already waiting.
 * Never fails the caller: a file that can't be queued is picked up by the
 * `ingest-pending-files` cron instead.
 */
export default async function enqueueFileIngest({ file_id }: Params) {
    try {
        const open = await BunSQLite.sql<BUN_SQLITE_COBBLE_FILE_INGEST_QUEUE>({
            sql: `SELECT id FROM file_ingest_queue WHERE file_id = ? AND status IN ('pending', 'processing') LIMIT 1`,
            values: [file_id],
        });

        if (open.payload?.[0]?.id) {
            wakeFileIngest();
            return;
        }

        await BunSQLite.queue.add({
            table: "file_ingest_queue",
            data: [{ file_id: Number(file_id) }],
        });

        wakeFileIngest();
    } catch {
        /**
         * The cron sweeps it up.
         */
    }
}
