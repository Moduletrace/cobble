import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";

type Params = {
    job_id: number | string;
    /**
     * Unix ms before which the job can't be claimed again.
     */
    until: number;
};

/**
 * Puts a claimed ingest job back to wait, giving back the attempt it
 * used: every embedding model was resting, so nothing was tried. Capped
 * at `AppData.HarnessMaxCooldownMs` from now.
 */
export default async function deferIngestJob({ job_id, until }: Params) {
    const now = Date.now();
    const at = Math.min(Math.max(until, now + AppData.HarnessCooldownMs), now + AppData.HarnessMaxCooldownMs);

    await BunSQLite.sql({
        sql: `UPDATE file_ingest_queue SET status = 'pending', locked_at = NULL, locked_by = NULL,
            attempts = MAX(attempts - 1, 0), available_at = ?, updated_at = ?
            WHERE id = ? AND status = 'processing'`,
        values: [at, now, job_id],
    });
}
