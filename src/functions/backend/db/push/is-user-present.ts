import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_USER_PRESENCE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";

/**
 * Whether the app is open for this user right now (any process), based on
 * the socket keepalive. Push notifications are skipped while it is.
 */
export default async function isUserPresent({
    user_id,
}: {
    user_id: number | string;
}) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_USER_PRESENCE>({
            sql: `SELECT last_seen_at FROM user_presence WHERE user_id = ? LIMIT 1`,
            values: [user_id],
        })
    ).payload?.[0];

    if (!row?.last_seen_at) return false;

    return Date.now() - Number(row.last_seen_at) <= AppData.PushPresenceWindowMs;
}
