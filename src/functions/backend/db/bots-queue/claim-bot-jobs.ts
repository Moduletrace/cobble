import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOTS_QUEUE,
    BunSQLiteTables,
} from "@/db/types/db";

type Params = {
    /**
     * Unique id of the handler claiming, e.g. `main:<pid>`. Every later
     * update, completion or failure must pass the same id.
     */
    worker: string;
    limit?: number;
};

/**
 * Claims the next pending jobs for a queue handler. Jobs whose handler
 * stopped sending updates are released back to the queue first, so a lost
 * job is picked up again (resume from its `checkpoint`).
 */
export default async function claimBotJobs({ worker, limit = 1 }: Params) {
    const res = await BunSQLite.queue.claim<
        BUN_SQLITE_COBBLE_BOTS_QUEUE,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bots_queue",
        worker,
        limit,
    });

    if (!res.success) {
        throw new Error(`Couldn't claim jobs: ${res.msg || res.error}`);
    }

    const jobs = res.payload || [];

    for (const job of jobs) {
        if (job.id && !job.started_at) {
            const now = Date.now();

            await BunSQLite.sql({
                sql: `UPDATE bots_queue SET started_at = ? WHERE id = ?`,
                values: [now, job.id],
            });

            job.started_at = now;
        }
    }

    return jobs;
}
