import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
    user_id: number | string;
};

/**
 * A session only if it's the given user's own.
 */
export default async function grabUserBotSession({
    session_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
        sql: `SELECT s.* FROM bot_sessions s WHERE s.id = ? AND s.user_id = ? LIMIT 1`,
        values: [session_id, user_id],
    });

    return res.payload?.[0] || null;
}
