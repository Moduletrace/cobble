import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent?: string | null;
    platform?: string | null;
};

/**
 * Saves a device's subscription. The endpoint is unique: subscribing again
 * (an updated key, or a shared device signing in as someone else) replaces
 * the keys and moves it to this user.
 */
export default async function savePushSubscription({
    user_id,
    endpoint,
    p256dh,
    auth,
    user_agent,
    platform,
}: Params): Promise<void> {
    const now = Date.now();
    const fields = {
        user_id: Number(user_id),
        endpoint,
        p256dh,
        auth,
        user_agent: user_agent || null,
        platform: platform || null,
        last_error: null,
        updated_at: now,
    };

    await BunSQLite.sql({
        sql: `INSERT INTO push_subscriptions (created_at, updated_at, user_id, endpoint, p256dh, auth, user_agent, platform, last_used_at, last_error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            ON CONFLICT(endpoint) DO UPDATE SET
                user_id = excluded.user_id,
                p256dh = excluded.p256dh,
                auth = excluded.auth,
                user_agent = COALESCE(excluded.user_agent, push_subscriptions.user_agent),
                platform = COALESCE(excluded.platform, push_subscriptions.platform),
                last_error = NULL,
                updated_at = excluded.updated_at`,
        values: [
            now,
            now,
            fields.user_id,
            fields.endpoint,
            fields.p256dh,
            fields.auth,
            fields.user_agent,
            fields.platform,
            now,
        ],
    });
}
