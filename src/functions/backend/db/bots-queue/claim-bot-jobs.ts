import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotJobKind } from "@/src/dict/bot-queue-dict";
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
    /**
     * Only jobs of this kind, so replies and tasks get their own slots.
     */
    kind: BotJobKind;
};

/**
 * Claims the next pending jobs of one kind for a queue handler. Jobs
 * whose handler stopped sending updates are released back to the queue
 * first, so a lost job is picked up again (resume from its `checkpoint`).
 *
 * bun-sqlite's `queue.claim` takes no filter, so the claim is its same
 * single statement (atomic: two workers never claim one job) plus `kind`.
 */
export default async function claimBotJobs({ worker, limit = 1, kind }: Params) {
    const released = await BunSQLite.queue.release_stale<
        BUN_SQLITE_COBBLE_BOTS_QUEUE,
        (typeof BunSQLiteTables)[number]
    >({ table: "bots_queue" });

    if (!released.success) {
        throw new Error(`Couldn't release stale jobs: ${released.msg || released.error}`);
    }

    if (limit < 1) return [];

    const now = Date.now();

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
        sql: `UPDATE bots_queue SET status = 'processing', attempts = attempts + 1,
            locked_at = ?, locked_by = ?, updated_at = ?
            WHERE id IN (
                SELECT id FROM bots_queue
                WHERE status = 'pending' AND available_at <= ? AND kind = ?
                ORDER BY id LIMIT ?
            ) RETURNING *`,
        values: [now, worker, now, now, kind, Math.floor(limit)],
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
