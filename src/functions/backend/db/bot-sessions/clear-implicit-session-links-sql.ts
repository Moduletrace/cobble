/**
 * Clears `previous_session_id` on every session that wasn't carried over:
 * before v0.3.0 a rollover and New session linked each session to the
 * one before it, so threads offered "Show the previous session" and
 * prompts read summaries of sessions nothing was carried from. A carry
 * over always opens its session with a message naming the one it came
 * from (`carried_from_session_id`); a link without one is cleared.
 */
export default function clearImplicitSessionLinksSql() {
    return {
        sql: `UPDATE bot_sessions SET previous_session_id = NULL
            WHERE previous_session_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM bot_messages m
                WHERE m.session_id = bot_sessions.id
                AND m.carried_from_session_id = bot_sessions.previous_session_id
            )`,
        values: [] as number[],
    };
}
