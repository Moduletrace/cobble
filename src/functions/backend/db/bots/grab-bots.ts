import type { BotWithLastMessage } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import chatBotsSql from "@/src/utils/crew-access/chat-bots-sql";
import workspaceBotsSql from "@/src/utils/crew-access/workspace-bots-sql";
import botFaceSql from "@/src/utils/bot-face-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    user_id: number | string;
    /**
     * A workspace's crew instead: the bots the user chats with there
     * (check they're in the workspace first), with their conversations
     * there.
     */
    workspace_id?: number | string | null;
};

/**
 * The bots a user chats with, for the rail: in their own chat
 * (`chatBotsSql`) or in one workspace (`workspaceBotsSql`). The
 * coordinator is pinned first, then workers by latest activity. Each row
 * carries the user's own face (`botFaceSql`) and conversation there: its
 * unread flag, latest activity and latest message, and in a workspace
 * whether it's that workspace's admin (`is_admin`).
 */
export default async function grabBots({
    user_id,
    workspace_id,
}: Params): Promise<BotWithLastMessage[]> {
    const scope = workspace_id ? Number(workspace_id) : null;
    const role = await grabCrewRole({ user_id });
    const access = scope ? workspaceBotsSql({ role, workspace_id: scope }) : chatBotsSql({ role, user_id });

    const face = botFaceSql({ user_id });

    let sql = ``;

    sql += `SELECT\n`;
    sql += `    b.*,\n`;
    sql += `    ${face.sql},\n`;
    sql += `    COALESCE(t.unread, 0) AS unread,\n`;
    sql += `    t.last_activity_at AS last_activity_at,\n`;
    sql += `    lm.text AS last_message_text,\n`;
    sql += `    lm.created_at AS last_message_at,\n`;
    sql += `    EXISTS (SELECT 1 FROM bot_types bt WHERE bt.bot_id = b.id AND bt.bot_type = 'admin' AND bt.workspace_id = ?) AS is_admin\n`;
    sql += `FROM bots b\n`;
    sql += `LEFT JOIN (\n`;
    sql += `    SELECT bot_id, MAX(unread) AS unread, MAX(last_activity_at) AS last_activity_at\n`;
    sql += `    FROM bot_sessions WHERE workspace_id IS ? AND user_id = ? GROUP BY bot_id\n`;
    sql += `) t ON t.bot_id = b.id\n`;
    sql += `LEFT JOIN bot_messages lm ON lm.id = (\n`;
    sql += `    SELECT m.id FROM bot_messages m JOIN bot_sessions s ON s.id = m.session_id\n`;
    sql += `    WHERE m.bot_id = b.id AND m.workspace_id IS ? AND s.user_id = ?\n`;
    sql += `    ORDER BY m.created_at DESC, m.id DESC\n`;
    sql += `    LIMIT 1\n`;
    sql += `)\n`;
    sql += `WHERE ${access.sql}\n`;
    sql += `ORDER BY\n`;
    sql += `    CASE WHEN b.kind = 'coordinator' THEN 0 ELSE 1 END,\n`;
    sql += `    COALESCE(lm.created_at, t.last_activity_at, b.created_at) DESC\n`;

    const res = await BunSQLite.sql<BotWithLastMessage>({
        sql,
        values: [...face.values, scope, scope, user_id, scope, user_id, ...access.values],
    });

    return (res.payload || []).map((bot) => ({ ...bot, is_admin: Boolean(bot.is_admin) }));
}
