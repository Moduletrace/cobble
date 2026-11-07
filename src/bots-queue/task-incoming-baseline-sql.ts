import type { SqlCondition } from "@/src/utils/crew-access/types";

type Params = {
    session_id: number | string;
    /**
     * When the run was queued (`bots_queue.created_at`, ms).
     */
    queued_at: number;
};

/**
 * The SQL for the newest message a session had when a run was queued:
 * what the user writes after it is new to the run, however long it waited
 * for its computer or how often it was tried. Selects one `id` column, 0
 * for an empty session.
 */
export default function taskIncomingBaselineSql({ session_id, queued_at }: Params): SqlCondition {
    return {
        sql: `SELECT COALESCE(MAX(id), 0) AS id FROM bot_messages WHERE session_id = ? AND created_at <= ?`,
        values: [Number(session_id), Number(queued_at)],
    };
}
