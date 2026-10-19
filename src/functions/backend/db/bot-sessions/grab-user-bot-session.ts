import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
    user_id: number | string;
};

/**
 * A session only if its bot belongs to the given owner.
 */
export default async function grabUserBotSession({
    session_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
        sql: `SELECT s.* FROM bot_sessions s JOIN bots b ON b.id = s.bot_id
            WHERE s.id = ? AND b.user_id = ? LIMIT 1`,
        values: [session_id, user_id],
    });

    return res.payload?.[0] || null;
}
