type Params = {
    job_id: number;
    /**
     * The call as the brief shows it (`hookPayloadBlock`).
     */
    block: string;
    now: number;
};

/**
 * Adds a hook call to the end of its last run's brief, only while that
 * run is still waiting and was never tried: a run that has started (or
 * failed once and waits to retry) is left as it is. The check and the
 * change are one statement, so a run claimed meanwhile is never touched.
 * `RETURNING id` says whether it joined.
 */
export default function mergeHookCallSql({ job_id, block, now }: Params) {
    return {
        sql: `UPDATE bots_queue SET instructions = COALESCE(instructions, '') || ?, updated_at = ?
            WHERE id = ? AND status = 'pending' AND COALESCE(attempts, 0) = 0 RETURNING id`,
        values: [`\n\nAnother call came in before this run started:\n\n${block}`, now, job_id] as (string | number)[],
    };
}
