type Params = {
    now: number;
};

/**
 * The threads that versions before this one left with a silent hook while
 * the user was chatting in them: the ones holding the user's own words, and
 * the ones the user has on screen (a silent hook's thread is only ever
 * active because the user was in it). Handing them back at boot makes those
 * conversations reach their user again (pushed, unread, the bot's face),
 * and each hook opens a fresh thread on its next call.
 */
export default function adoptChattedHookSessionsSql({ now }: Params) {
    return {
        sql: `UPDATE bot_sessions SET hook_id = NULL, updated_at = ?
            WHERE hook_id IN (SELECT id FROM bot_hooks WHERE silent = 1)
                AND (
                    status = 'active'
                    OR EXISTS (
                        SELECT 1 FROM bot_messages m
                        WHERE m.session_id = bot_sessions.id
                            AND m.author = 'user'
                            AND m.from_ask_id IS NULL
                            AND m.from_install_request_id IS NULL
                    )
                )
            RETURNING id`,
        values: [now] as (string | number)[],
    };
}