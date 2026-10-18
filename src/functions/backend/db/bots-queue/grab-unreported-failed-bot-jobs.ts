import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";

/**
 * Failed jobs the user hasn't been told about: the ones bun-sqlite failed
 * itself after a lock timeout on their last attempt. Jobs failed through
 * `failBotJob` or cancelled already have `finished_at`.
 */
export default async function grabUnreportedFailedBotJobs() {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
        sql: `SELECT * FROM bots_queue WHERE status = 'failed' AND finished_at IS NULL ORDER BY id ASC`,
    });

    return res.payload || [];
}
