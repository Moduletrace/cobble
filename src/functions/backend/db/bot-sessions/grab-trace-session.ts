import type { BUN_SQLITE_COBBLE_BOT_SESSIONS, BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";

type Params = {
    session_id: number | string;
    user_id: number | string;
    user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
};

/**
 * A session whose run trace may be read: the session user's own, or any
 * session for a super admin (who reaches every bot and workspace).
 */
export default async function grabTraceSession({
    session_id,
    user_id,
    user_types,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
        sql: `SELECT s.* FROM bot_sessions s WHERE s.id = ? LIMIT 1`,
        values: [session_id],
    });

    const session = res.payload?.[0] || null;

    if (!session?.id) return null;

    if (Number(session.user_id) == Number(user_id)) return session;

    return isPassThroughUser({ user_types }) ? session : null;
}