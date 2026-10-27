import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import type { BotSessionChangedData } from "@/src/types";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    /**
     * Unix ms: sessions updated since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-session` for every session created or changed since
 * `since` (named, reopened, marked read) to the connected user whose
 * conversation it's in. Pushes are idempotent, so overlapping windows only
 * repeat them.
 */
export default async function relayChangedSessions({ since, users }: Params) {
    if (!users.size) return;

    const sessions =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
                sql: `SELECT id, user_id, bot_id, workspace_id FROM bot_sessions WHERE updated_at > ? AND chatroom_id IS NULL`,
                values: [since],
            })
        ).payload || [];

    for (const session of sessions) {
        if (!session.id || !session.user_id || !users.has(String(session.user_id))) continue;

        const data: BotSessionChangedData = {
            session_id: Number(session.id),
            bot_id: Number(session.bot_id) || 0,
            workspace_id: session.workspace_id ? Number(session.workspace_id) : null,
        };

        sendToUser({
            user_id: session.user_id,
            data: { event: "server:bot-session", data },
        });
    }
}
