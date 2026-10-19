import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import type { WebSocketDataType } from "@/src/types";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    session_id?: number | string | null;
    data: WebSocketDataType;
};

/**
 * Live update to the open tabs of the user a session belongs to: only
 * they see that conversation. Best effort: nothing is queued for offline
 * users, who see the change on their next page load.
 */
export default async function pushToSessionUser({ session_id, data }: Params) {
    if (!session_id) return;

    const session = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
            sql: `SELECT user_id FROM bot_sessions WHERE id = ? LIMIT 1`,
            values: [session_id],
        })
    ).payload?.[0];

    if (!session?.user_id) return;

    sendToUser({ user_id: session.user_id, data });
}
