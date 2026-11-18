import BunSQLite from "@moduletrace/bun-sqlite";
import followedSessionSql from "../bot-sessions/followed-session-sql";

type Params = {
    bot_id: number | string;
    /**
     * Only jobs in this user's conversations.
     */
    user_id: number | string;
    /**
     * Leave out jobs the user doesn't follow (a crew request's, a silent
     * hook's), which never show on the bot's face.
     */
    conversations_only?: boolean;
};

/**
 * How many of a bot's jobs for one user are still pending or processing.
 */
export default async function countOpenBotJobs({ bot_id, user_id, conversations_only }: Params) {
    const res = await BunSQLite.sql<{ open: number }>({
        sql: `SELECT COUNT(*) AS open FROM bots_queue WHERE bot_id = ? AND status IN ('pending', 'processing')
            AND session_id IN (SELECT id FROM bot_sessions WHERE user_id = ?${
                conversations_only ? ` AND ${followedSessionSql()}` : " AND ask_id IS NULL AND hook_id IS NULL"
            })`,
        values: [bot_id, user_id],
    });

    return Number(res.payload?.[0]?.open || 0);
}
