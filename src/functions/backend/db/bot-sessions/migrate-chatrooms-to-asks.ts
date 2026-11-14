import BunSQLite from "@moduletrace/bun-sqlite";
import deleteSessionRows from "./delete-session-rows";

/**
 * Chatrooms are gone: a bot asks another bot through the coordinator's gate
 * now (`bot_asks`), and a request's part is a session with an `ask_id`. The
 * schema sync drops the `chatrooms` table and the `chatroom_id` column
 * before the app boots, so what is left of an old room is its sessions,
 * still marked `chatroom`. They are read by nothing any more; this deletes
 * them with their messages and jobs, once, at boot.
 */
export default async function migrateChatroomsToAsks() {
    const sessions = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bot_sessions WHERE status = 'chatroom'`,
        })
    ).payload || [];

    if (!sessions.length) return;

    await deleteSessionRows({ session_ids: sessions.map((session) => Number(session.id)) });
}
