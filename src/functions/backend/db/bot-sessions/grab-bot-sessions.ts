import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { BotSessionListItem } from "@/src/types";

type Params = {
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Matches the session's title, summary or any of its messages.
     */
    query?: string;
    page?: number;
};

/**
 * A conversation's sessions for the sessions modal, latest activity first,
 * each with its message count and latest message. Empty sessions are left
 * out unless active.
 */
export default async function grabBotSessions({
    bot_id,
    workspace_id,
    query,
    page = 1,
}: Params): Promise<BotSessionListItem[]> {
    const search = query?.trim();
    const like = search ? `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const limit = AppData.BotSessionsPageSize;

    let sql = ``;

    sql += `SELECT s.*,\n`;
    sql += `    (SELECT COUNT(*) FROM bot_messages m WHERE m.session_id = s.id) AS message_count,\n`;
    sql += `    (SELECT m.text FROM bot_messages m WHERE m.session_id = s.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message_text\n`;
    sql += `FROM bot_sessions s\n`;
    sql += `WHERE s.bot_id = ? AND s.workspace_id IS ?\n`;
    sql += `AND (s.status = 'active' OR EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = s.id))\n`;

    if (like) {
        sql += `AND (s.title LIKE ? ESCAPE '\\' OR s.summary LIKE ? ESCAPE '\\'\n`;
        sql += `    OR EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = s.id AND m.text LIKE ? ESCAPE '\\'))\n`;
    }

    sql += `ORDER BY s.status = 'active' DESC, s.last_activity_at DESC, s.id DESC\n`;
    sql += `LIMIT ? OFFSET ?\n`;

    const res = await BunSQLite.sql<BotSessionListItem>({
        sql,
        values: [
            bot_id,
            workspace_id ? Number(workspace_id) : null,
            ...(like ? [like, like, like] : []),
            limit,
            (Math.max(1, page) - 1) * limit,
        ],
    });

    return res.payload || [];
}
