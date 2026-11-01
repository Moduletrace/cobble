import BunSQLite from "@moduletrace/bun-sqlite";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    /**
     * Unix ms: calls received or changed since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:hook-call-updated` for every hook with a call received or
 * answered since `since` to its connected owner, so an open hook thread
 * reloads. Pushes are idempotent, so overlapping windows only repeat them.
 */
export default async function relayChangedHookCalls({ since, users }: Params) {
    if (!users.size) return;

    const rows =
        (
            await BunSQLite.sql<{ hook_id: number; user_id: number }>({
                sql: `SELECT DISTINCT e.hook_id, h.user_id FROM bot_hook_events e JOIN bot_hooks h ON h.id = e.hook_id
                    WHERE e.updated_at > ? LIMIT 200`,
                values: [since],
            })
        ).payload || [];

    for (const { hook_id, user_id } of rows) {
        if (!users.has(String(user_id))) continue;

        sendToUser({ user_id, data: { event: "server:hook-call-updated", data: { hook_id } } });
    }
}
