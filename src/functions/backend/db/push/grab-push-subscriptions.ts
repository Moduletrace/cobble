import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_PUSH_SUBSCRIPTIONS } from "@/db/types/db";

/**
 * A user's subscribed devices, newest first.
 */
export default async function grabPushSubscriptions({
    user_id,
}: {
    user_id: number | string;
}) {
    return (
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_PUSH_SUBSCRIPTIONS>({
                sql: `SELECT * FROM push_subscriptions WHERE user_id = ? ORDER BY created_at DESC`,
                values: [user_id],
            })
        ).payload || []
    );
}
