import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import chatroomSummaries from "@/src/functions/backend/db/chatrooms/chatroom-summaries";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    /**
     * Unix ms: rooms opened or changed since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:chatroom-updated` for every room opened or changed since
 * `since` (a new message, a turn, a final status) to its connected user.
 * Pushes are idempotent, so overlapping windows only repeat them.
 */
export default async function relayChangedChatrooms({ since, users }: Params) {
    if (!users.size) return;

    const rooms =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
                sql: `SELECT * FROM chatrooms WHERE updated_at > ? OR last_activity_at > ? LIMIT 200`,
                values: [since, since],
            })
        ).payload || [];

    const mine = rooms.filter((room) => room.user_id && users.has(String(room.user_id)));

    for (const summary of await chatroomSummaries({ chatrooms: mine })) {
        sendToUser({ user_id: summary.user_id!, data: { event: "server:chatroom-updated", data: summary } });
    }
}
