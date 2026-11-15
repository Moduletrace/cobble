import BunSQLite from "@moduletrace/bun-sqlite";
import deleteSessionRows from "./delete-session-rows";

type Params = {
    session_id: number | string;
};

/**
 * Drops a crew request's hidden session when nothing ever landed in it:
 * the coordinator's review runs in one, and it writes no message there.
 * Only a session with no messages and no open job goes, so an answer's
 * session is never touched. It goes the way any other session does
 * (`deleteSessionRows`): the review job that just ended, its queue updates
 * and what its calls were billed leave with it, since foreign keys are off
 * outside the server process.
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

    await deleteSessionRows({ session_ids: [Number(id)] });

    return true;
}
