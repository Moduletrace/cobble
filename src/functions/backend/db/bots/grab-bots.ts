import type { BotWithLastMessage } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
};

/**
 * A workspace's crew for the rail: the coordinator pinned first, then
 * workers by latest activity. Each row carries its latest message.
 */
export default async function grabBots({
    user_id,
}: Params): Promise<BotWithLastMessage[]> {
    let sql = ``;

    sql += `SELECT\n`;
    sql += `    b.*,\n`;
    sql += `    lm.text AS last_message_text,\n`;
    sql += `    lm.created_at AS last_message_at\n`;
    sql += `FROM bots b\n`;
    sql += `LEFT JOIN bot_messages lm ON lm.id = (\n`;
    sql += `    SELECT id FROM bot_messages\n`;
    sql += `    WHERE bot_id = b.id\n`;
    sql += `    ORDER BY created_at DESC, id DESC\n`;
    sql += `    LIMIT 1\n`;
    sql += `)\n`;
    sql += `WHERE b.user_id = ?\n`;
    sql += `ORDER BY\n`;
    sql += `    CASE WHEN b.kind = 'coordinator' THEN 0 ELSE 1 END,\n`;
    sql += `    COALESCE(lm.created_at, b.last_activity_at, b.created_at) DESC\n`;

    const res = await BunSQLite.sql<BotWithLastMessage>({
        sql,
        values: [user_id],
    });

    return res.payload || [];
}
