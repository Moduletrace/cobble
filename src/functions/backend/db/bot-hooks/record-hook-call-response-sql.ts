type Params = {
    hook_id: number;
    /**
     * The run that ended.
     */
    job_id: number;
    status: "done" | "failed";
    response: string;
    message_id?: number | null;
    now: number;
};

/**
 * Writes a run's end onto every call it took in (the one that queued it
 * and any merged into it): answered or failed, with its response. Only
 * calls still waiting on it change, so a call already answered never is
 * written over.
 */
export default function recordHookCallResponseSql({ hook_id, job_id, status, response, message_id, now }: Params) {
    return {
        sql: `UPDATE bot_hook_events SET status = ?, response = ?, response_message_id = ?, responded_at = ?, updated_at = ?
            WHERE hook_id = ? AND job_id = ? AND status IN ('queued', 'merged') RETURNING id`,
        values: [status, response, message_id ?? null, now, now, hook_id, job_id] as (string | number | null)[],
    };
}
