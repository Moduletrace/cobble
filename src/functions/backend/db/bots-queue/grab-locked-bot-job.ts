import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";

type Params = {
    job_id: number | string;
    worker: string;
};

/**
 * A job only while the given handler still holds it. Null once its lock
 * timed out and it went back to the queue (or another handler took it).
 */
export default async function grabLockedBotJob({
    job_id,
    worker,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS_QUEUE | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
        sql: `SELECT * FROM bots_queue WHERE id = ? AND status = 'processing' AND locked_by = ? LIMIT 1`,
        values: [job_id, worker],
    });

    return res.payload?.[0] || null;
}
