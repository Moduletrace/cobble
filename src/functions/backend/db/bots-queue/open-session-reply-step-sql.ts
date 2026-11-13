type Params = {
    session_id: number | string;
};

/**
 * The newest step of the reply job a session still runs, with the job's
 * task and session beside it, so a conversation that reloaded (or missed
 * the step's push) shows what the reply is doing instead of waiting for its
 * next step. A reply's steps are never stored with the task they belong to
 * the way a task's are (`grabBotJobUpdates`), so they are read here.
 *
 * Only an open job's, only a reply's, and only a tool step: a closing note's
 * text is the answer, about to land as the message.
 */
export default function openSessionReplyStepSql({ session_id }: Params) {
    return {
        sql: `SELECT u.*, q.task_id AS task_id, q.session_id AS session_id
            FROM bots_queue_updates u
            JOIN bots_queue q ON q.id = u.bots_queue_id
            WHERE q.session_id = ? AND q.kind = 'reply' AND q.status IN ('pending', 'processing')
                AND u.kind = 'tool' AND u.text IS NOT NULL
            ORDER BY u.id DESC
            LIMIT 1`,
        values: [Number(session_id)],
    };
}