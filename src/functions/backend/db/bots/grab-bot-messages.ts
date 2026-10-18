import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    limit?: number;
};

/**
 * The latest messages of a bot's conversation, oldest first.
 */
export default async function grabBotMessages({
    bot_id,
    limit = 100,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES[]> {
    let sql = ``;

    sql += `SELECT * FROM (\n`;
    sql += `    SELECT * FROM bot_messages\n`;
    sql += `    WHERE bot_id = ?\n`;
    sql += `    ORDER BY created_at DESC, id DESC\n`;
    sql += `    LIMIT ?\n`;
    sql += `) ORDER BY created_at ASC, id ASC\n`;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
        sql,
        values: [bot_id, limit],
    });

    return res.payload || [];
}
