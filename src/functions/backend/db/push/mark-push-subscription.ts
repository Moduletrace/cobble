import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Records the result of a send. A subscription the push service says is
 * gone is deleted; anything else keeps its error for the settings list.
 */
export default async function markPushSubscription({
    endpoint,
    error,
}: {
    endpoint: string;
    error?: string | null;
}) {
    if (error) {
        await BunSQLite.sql({
            sql: `UPDATE push_subscriptions SET last_error = ?, updated_at = ? WHERE endpoint = ?`,
            values: [error, Date.now(), endpoint],
        });
        return;
    }

    await BunSQLite.sql({
        sql: `UPDATE push_subscriptions SET last_used_at = ?, last_error = NULL, updated_at = ? WHERE endpoint = ?`,
        values: [Date.now(), Date.now(), endpoint],
    });
}

/**
 * The push service no longer knows this device (gone, or a new endpoint).
 */
export async function deleteGonePushSubscription({ endpoint }: { endpoint: string }) {
    await BunSQLite.sql({
        sql: `DELETE FROM push_subscriptions WHERE endpoint = ?`,
        values: [endpoint],
    });
}
