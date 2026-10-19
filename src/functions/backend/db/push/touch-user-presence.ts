import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * At most one write per user every 15s in this process; the keepalive
 * arrives every 30s per socket, and a burst of sockets would otherwise
 * write repeatedly for no extra accuracy.
 */
const last_written_at = new Map<string, number>();

/**
 * Marks a user as having an open app socket. The bots layout keeps its
 * socket alive with a raw keepalive, so this is refreshed while the app
 * is open. A stale value only means a push may be sent a minute late.
 */
export default async function touchUserPresence({
    user_id,
}: {
    user_id: number | string;
}) {
    const key = String(user_id);
    const now = Date.now();

    if (now - (last_written_at.get(key) || 0) < 15_000) return;

    last_written_at.set(key, now);

    await BunSQLite.sql({
        sql: `INSERT INTO user_presence (created_at, updated_at, user_id, last_seen_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET last_seen_at = excluded.last_seen_at, updated_at = excluded.updated_at`,
        values: [now, now, user_id, now],
    });
}
