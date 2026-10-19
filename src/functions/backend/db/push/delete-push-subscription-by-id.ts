import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Removes one of the user's devices by its row id (the settings list
 * never sees endpoints, which are capability URLs).
 */
export default async function deletePushSubscriptionById({
    user_id,
    id,
}: {
    user_id: number | string;
    id: number | string;
}) {
    await BunSQLite.sql({
        sql: `DELETE FROM push_subscriptions WHERE user_id = ? AND id = ?`,
        values: [user_id, id],
    });
}
