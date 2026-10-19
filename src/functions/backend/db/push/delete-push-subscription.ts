import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Removes one of the user's devices. The endpoint is the identity; a
 * subscription another user saved can't be touched.
 */
export default async function deletePushSubscription({
    user_id,
    endpoint,
}: {
    user_id: number | string;
    endpoint: string;
}) {
    await BunSQLite.sql({
        sql: `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
        values: [user_id, endpoint],
    });
}
