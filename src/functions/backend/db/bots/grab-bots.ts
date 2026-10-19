import type { BotWithLastMessage } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    /**
     * A workspace's crew instead: the coordinator and the bots in it, with
     * their conversations in that workspace.
     */
    workspace_id?: number | string | null;
};

/**
 * A user's crew for the rail: the coordinator pinned first, then
 * workers by latest activity. Each row carries its conversation's unread
 * flag, latest activity and latest message: in its own chat, or in the
 * workspace when one is given.
 */
export default async function grabBots({
    user_id,
    workspace_id,
}: Params): Promise<BotWithLastMessage[]> {
    const scope = workspace_id ? Number(workspace_id) : null;

    let sql = ``;

    sql += `SELECT\n`;
    sql += `    b.*,\n`;
    sql += `    COALESCE(t.unread, 0) AS unread,\n`;
    sql += `    t.last_activity_at AS last_activity_at,\n`;
    sql += `    lm.text AS last_message_text,\n`;
    sql += `    lm.created_at AS last_message_at\n`;
    sql += `FROM bots b\n`;
    sql += `LEFT JOIN (\n`;
    sql += `    SELECT bot_id, MAX(unread) AS unread, MAX(last_activity_at) AS last_activity_at\n`;
    sql += `    FROM bot_sessions WHERE workspace_id IS ? GROUP BY bot_id\n`;
    sql += `) t ON t.bot_id = b.id\n`;
    sql += `LEFT JOIN bot_messages lm ON lm.id = (\n`;
    sql += `    SELECT id FROM bot_messages\n`;
    sql += `    WHERE bot_id = b.id AND workspace_id IS ?\n`;
    sql += `    ORDER BY created_at DESC, id DESC\n`;
    sql += `    LIMIT 1\n`;
    sql += `)\n`;
    sql += `WHERE b.user_id = ?\n`;

    if (scope) {
        sql += `AND (b.kind = 'coordinator' OR b.id IN (SELECT bot_id FROM workspace_bots WHERE workspace_id = ?))\n`;
    }

    sql += `ORDER BY\n`;
    sql += `    CASE WHEN b.kind = 'coordinator' THEN 0 ELSE 1 END,\n`;
    sql += `    COALESCE(lm.created_at, t.last_activity_at, b.created_at) DESC\n`;

    const res = await BunSQLite.sql<BotWithLastMessage>({
        sql,
        values: [scope, scope, user_id, ...(scope ? [scope] : [])],
    });

    return res.payload || [];
}
