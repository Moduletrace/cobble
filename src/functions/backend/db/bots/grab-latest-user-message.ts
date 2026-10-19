import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

type Params = {
    session_id: number | string;
};

/**
 * The newest message the user wrote in a session, which a bot's reaction
 * defaults to.
 */
export default async function grabLatestUserMessage({
    session_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
        sql: `SELECT * FROM bot_messages WHERE session_id = ? AND author = 'user' ORDER BY id DESC LIMIT 1`,
        values: [session_id],
    });

    return res.payload?.[0] || null;
}
