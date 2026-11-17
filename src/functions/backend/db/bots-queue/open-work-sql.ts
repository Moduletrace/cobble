import type { SqlCondition } from "@/src/utils/crew-access/types";

type Params = {
    bot_id: number | string;
    session_id: number | string;
};

/**
 * The SQL for a run of the bot's in this session, or a job it handed over
 * from here, still queued or working: its result is still to come, so an
 * answer may honestly say work is under way. A plan step is an ordinary
 * reply job carrying `params.plan_id`, so it counts too - "step 2 is
 * running" is not a false claim while that step works (L5). Selects `id`.
 */
export default function openWorkSql({ bot_id, session_id }: Params): SqlCondition {
    return {
        sql: `SELECT id FROM bots_queue
            WHERE status IN ('pending', 'processing')
                AND (
                    (kind = 'task' AND ((bot_id = ? AND session_id = ?) OR requested_by_session_id = ?))
                    OR (kind = 'reply' AND bot_id = ? AND session_id = ?
                        AND json_extract(COALESCE(params, '{}'), '$.plan_id') IS NOT NULL)
                )
            LIMIT 1`,
        values: [Number(bot_id), Number(session_id), Number(session_id), Number(bot_id), Number(session_id)],
    };
}