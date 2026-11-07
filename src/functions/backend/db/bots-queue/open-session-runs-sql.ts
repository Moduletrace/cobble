import type { SqlCondition } from "@/src/utils/crew-access/types";

type Params = {
    bot_id: number | string;
    session_id: number | string;
};

/**
 * The SQL for the bot's runs in a session that are queued or working and
 * take in what the user writes there: routine runs and hook calls act on
 * their own, so they're left out. Oldest first; selects `id`, `title` and
 * `status`.
 */
export default function openSessionRunsSql({ bot_id, session_id }: Params): SqlCondition {
    return {
        sql: `SELECT id, title, status FROM bots_queue
            WHERE bot_id = ? AND session_id = ? AND kind = 'task'
                AND status IN ('pending', 'processing')
                AND json_extract(COALESCE(params, '{}'), '$.schedule_id') IS NULL
                AND json_extract(COALESCE(params, '{}'), '$.hook_id') IS NULL
            ORDER BY id ASC`,
        values: [Number(bot_id), Number(session_id)],
    };
}
