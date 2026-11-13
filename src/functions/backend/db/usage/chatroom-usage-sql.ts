type Params = {
    /**
     * The rooms whose calls are read.
     */
    chatroom_ids: number[];
};

const marks = ({ chatroom_ids }: Params) => chatroom_ids.map(() => "?").join(", ");

/**
 * Every model call a room's bots made, by room and by bot, summed (read by
 * `grabChatroomUsage`). A call is counted by the session it ran for (each
 * bot in a room has its own hidden one, `bot_sessions.chatroom_id`), which
 * is the run's own attribution: a turn still running counts too, before
 * any message is written, so a room's total moves while it works.
 */
export function chatroomUsageCallsSql({ chatroom_ids }: Params) {
    return {
        sql: `SELECT s.chatroom_id AS chatroom_id, t.bot_id AS bot_id,
                COUNT(*) AS calls,
                SUM(t.prompt_tokens) AS prompt_tokens,
                SUM(t.cached_tokens) AS cached_tokens,
                SUM(t.completion_tokens) AS completion_tokens,
                SUM(t.cost) AS cost
            FROM token_usages t
            JOIN bot_sessions s ON s.id = t.session_id
            WHERE s.chatroom_id IN (${marks({ chatroom_ids })})
            GROUP BY 1, 2`,
        values: [...chatroom_ids],
    };
}

/**
 * The rooms' model calls that failed, by room, for the count beside the
 * totals. Read the same way, by the session they ran for.
 */
export function chatroomUsageFailuresSql({ chatroom_ids }: Params) {
    return {
        sql: `SELECT s.chatroom_id AS chatroom_id, COUNT(*) AS failed_calls
            FROM harness_call_failures t
            JOIN bot_sessions s ON s.id = t.session_id
            WHERE s.chatroom_id IN (${marks({ chatroom_ids })})
            GROUP BY 1`,
        values: [...chatroom_ids],
    };
}