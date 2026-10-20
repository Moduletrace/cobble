import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    session_id: number | string;
    title: string;
};

/**
 * The bot's task in this session with this title that's still queued or
 * working, if any, so the same work isn't started twice.
 */
export default async function grabOpenBotTask({ bot_id, session_id, title }: Params) {
    const res = await BunSQLite.sql<{ id: number; status: string }>({
        sql: `SELECT id, status FROM bots_queue
            WHERE bot_id = ? AND session_id = ? AND kind = 'task'
                AND status IN ('pending', 'processing')
                AND lower(trim(title)) = lower(trim(?))
            ORDER BY id DESC LIMIT 1`,
        values: [bot_id, session_id, title],
    });

    return res.payload?.[0] || null;
}
