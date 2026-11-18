type Params = {
    session_id: number;
    now: number;
};

/**
 * Hands a session to the user who wrote in it. A silent hook's thread is
 * the hook's only until the user types there; from then on it is an
 * ordinary conversation, so its messages reach the user's tabs, its unread
 * counts and the bot's face moves like anywhere else, while the hook's next
 * call opens a thread of its own. `RETURNING id` says whether the session
 * was a silent hook's.
 */
export default function adoptHookSessionSql({ session_id, now }: Params) {
    return {
        sql: `UPDATE bot_sessions SET hook_id = NULL, updated_at = ?
            WHERE id = ? AND hook_id IN (SELECT id FROM bot_hooks WHERE silent = 1)
            RETURNING id`,
        values: [now, session_id] as (string | number)[],
    };
}