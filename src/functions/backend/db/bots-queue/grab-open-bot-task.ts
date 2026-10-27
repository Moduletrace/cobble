import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    session_id: number | string;
    /**
     * Only a task with this title. Without it, any open task.
     */
    title?: string;
    /**
     * Only a task on this computer.
     */
    computer_id?: number | string | null;
};

/**
 * The bot's latest task in this session that's still queued or working
 * (with this title, on this computer, when given), if any, so the same
 * work isn't started twice.
 */
export default async function grabOpenBotTask({ bot_id, session_id, title, computer_id }: Params) {
    const res = await BunSQLite.sql<{ id: number; status: string; title: string | null }>({
        sql: `SELECT id, status, title FROM bots_queue
            WHERE bot_id = ? AND session_id = ? AND kind = 'task'
                AND status IN ('pending', 'processing')
                ${title != undefined ? `AND lower(trim(title)) = lower(trim(?))` : ""}
                ${computer_id ? `AND computer_id = ?` : ""}
            ORDER BY id DESC LIMIT 1`,
        values: [
            bot_id,
            session_id,
            ...(title != undefined ? [title] : []),
            ...(computer_id ? [Number(computer_id)] : []),
        ],
    });

    return res.payload?.[0] || null;
}
