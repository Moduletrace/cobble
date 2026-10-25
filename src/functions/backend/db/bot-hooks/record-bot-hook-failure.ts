import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    hook_id: number;
    /**
     * The run's job: only the hook's latest run records its failure.
     */
    job_id: number;
    error: string;
};

/**
 * Keeps why a hook's latest run failed in `last_error`, so its row shows
 * it. The next run that's queued clears it.
 */
export default async function recordBotHookFailure({ hook_id, job_id, error }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE bot_hooks SET last_error = ?, updated_at = ? WHERE id = ? AND last_job_id = ?`,
        values: [`Last run failed: ${error}`, Date.now(), hook_id, job_id],
    });
}
