import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import deleteSessionRows from "./delete-session-rows";

type Params = {
    /**
     * The user's session to make the conversation's active one.
     */
    session: BUN_SQLITE_COBBLE_BOT_SESSIONS;
};

/**
 * Makes a session the active one of its conversation: the session that was
 * active is closed, and one of its own that is still empty is deleted
 * instead, together with its rows (`deleteSessionRows`), since a job it
 * holds would otherwise point at a session that is gone. The caller checks
 * whatever must be refused first. Returns the session, active.
 */
export default async function activateBotSession({
    session,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const now = Date.now();
    const workspace_id = session.workspace_id || null;

    const emptied = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bot_sessions WHERE user_id = ? AND bot_id = ? AND workspace_id IS ? AND status = 'active'
                AND NOT EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = bot_sessions.id)`,
            values: [session.user_id!, session.bot_id!, workspace_id],
        })
    ).payload || [];

    await deleteSessionRows({ session_ids: emptied.map((row) => Number(row.id)) });

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET status = 'closed', unread = 0, updated_at = ?
            WHERE user_id = ? AND bot_id = ? AND workspace_id IS ? AND status = 'active'`,
        values: [now, session.user_id!, session.bot_id!, workspace_id],
    });

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET status = 'active', updated_at = ? WHERE id = ?`,
        values: [now, session.id!],
    });

    return { ...session, status: "active", updated_at: now };
}