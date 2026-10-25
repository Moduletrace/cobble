type Params = {
    hook_id: number;
    idempotency_key: string;
    /**
     * Calls before this (unix ms) no longer count.
     */
    since: number;
};

/**
 * A call to the hook with the same delivery id that was taken (queued a
 * run or joined one) since `since`. A rejected call doesn't count, so a
 * sender that fixed its signature can retry the same delivery.
 */
export default function seenHookCallSql({ hook_id, idempotency_key, since }: Params) {
    return {
        sql: `SELECT id FROM bot_hook_events
            WHERE hook_id = ? AND idempotency_key = ? AND status IN ('queued', 'merged') AND created_at > ?
            LIMIT 1`,
        values: [hook_id, idempotency_key, since] as (string | number)[],
    };
}
