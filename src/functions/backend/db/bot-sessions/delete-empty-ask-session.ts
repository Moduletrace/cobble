import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
};

/**
 * Drops a crew request's hidden session when nothing ever landed in it:
 * the coordinator's review runs in one, and it writes no message there.
 * Only a session with no messages and no open job goes, so an answer's
 * session is never touched. Foreign keys are off outside the server
 * process, so its job rows go explicitly.
 */
export default async function deleteEmptyAskSession({ session_id }: Params) {
    const res = await BunSQLite.sql({
        sql: `SELECT id FROM bot_sessions
            WHERE id = ? AND ask_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM bot_messages WHERE session_id = bot_sessions.id)
            AND NOT EXISTS (
                SELECT 1 FROM bots_queue
                WHERE session_id = bot_sessions.id AND status IN ('pending', 'processing')
            )`,
        values: [session_id],
    });

    const id = res.payload?.[0]?.id;

    if (!id) return false;

    await BunSQLite.sql({ sql: `DELETE FROM bot_job_traces WHERE session_id = ?`, values: [id] });
    await BunSQLite.sql({ sql: `DELETE FROM bot_tasks WHERE session_id = ?`, values: [id] });
    await BunSQLite.sql({ sql: `DELETE FROM bot_sessions WHERE id = ?`, values: [id] });

    return true;
}
