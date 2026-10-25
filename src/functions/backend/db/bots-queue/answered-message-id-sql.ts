import type { SqlCondition } from "@/src/utils/crew-access/types";

type Params = {
    session_id: number | string;
};

/**
 * The SQL for the newest user message a finished reply in the session
 * answered: a reply job's `message_id` is the newest one it read
 * (`markReplyAnswered`), so a message with a higher id came in after the
 * bot last looked and still needs an answer, wherever its reply landed in
 * the thread. Selects one `id` column, null when no reply has finished.
 */
export default function answeredMessageIdSql({ session_id }: Params): SqlCondition {
    return {
        sql: `SELECT MAX(message_id) AS id FROM bots_queue
            WHERE session_id = ? AND kind = 'reply' AND status = 'completed'`,
        values: [Number(session_id)],
    };
}
