import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";

type Params = {
    job_id: number | string;
    worker: string;
    /**
     * Unix ms before which the job can't be claimed again.
     */
    until: number;
    /**
     * Give back the attempt this claim used: nothing was tried.
     */
    refund?: boolean;
};

/**
 * Holds a job back without failing it: a pending job whose `available_at`
 * is pushed to `until` (capped at `AppData.HarnessMaxCooldownMs` from
 * now), or, for a job still held by `worker`, released back to pending
 * that way. False when the job is neither.
 */
export default async function deferBotJob({ job_id, worker, until, refund }: Params) {
    const now = Date.now();
    const at = Math.min(Math.max(until, now), now + AppData.HarnessMaxCooldownMs);

    const res = await BunSQLite.sql({
        sql: `UPDATE bots_queue SET status = 'pending', locked_at = NULL, locked_by = NULL,
            attempts = CASE WHEN ? AND status = 'processing' THEN MAX(attempts - 1, 0) ELSE attempts END,
            available_at = MAX(COALESCE(available_at, 0), ?), updated_at = ?
            WHERE id = ? AND (status = 'pending' OR (status = 'processing' AND locked_by = ?))
            RETURNING id`,
        values: [refund ? 1 : 0, at, now, job_id, worker],
    });

    return Boolean(res.payload?.length);
}
