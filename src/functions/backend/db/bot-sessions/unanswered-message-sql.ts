import type { SqlCondition } from "@/src/utils/crew-access/types";

type Params = {
    /**
     * The session the reply is answering in.
     */
    session_id: number | string;
    /**
     * The reply's own job: the message it answers is `bots_queue.message_id`.
     */
    job_id: number | string;
};

/**
 * The SQL for a user message the reply's job hasn't answered: one written
 * after the message the job answers, or, for a job queued with no message
 * (a plan's step), after the job was queued. Crew messages are left out:
 * they wake a bot, they aren't the user's own words. A run carrying the
 * conversation on while its answer is one of these leaves it behind in the
 * session it closes, unanswered.
 */
export default function unansweredMessageSql({ session_id, job_id }: Params): SqlCondition {
    return {
        sql: `EXISTS (SELECT 1 FROM bot_messages m JOIN bots_queue q ON q.id = ?
            WHERE m.session_id = ? AND m.author = 'user'
                AND m.from_ask_id IS NULL AND m.from_install_request_id IS NULL
                AND (m.id > q.message_id OR (q.message_id IS NULL AND m.created_at > q.created_at)))`,
        values: [Number(job_id), Number(session_id)],
    };
}