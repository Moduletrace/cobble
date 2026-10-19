import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

type Params = {
    session_id: number | string;
    message_id: number | string;
};

/**
 * A message only if it's in the given session, so a reply can't quote
 * another conversation's message.
 */
export default async function grabSessionMessage({
    session_id,
    message_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
        sql: `SELECT * FROM bot_messages WHERE id = ? AND session_id = ? LIMIT 1`,
        values: [message_id, session_id],
    });

    return res.payload?.[0] || null;
}
