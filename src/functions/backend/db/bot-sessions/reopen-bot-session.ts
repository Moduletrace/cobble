import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserBotSession from "./grab-user-bot-session";

type Params = {
    session_id: number | string;
    user_id: number | string;
};

/**
 * Makes a closed session of one of the user's conversations the active
 * one again, so the bot carries on from where it left off. The session
 * that was active is closed (an empty one is deleted).
 */
export default async function reopenBotSession({
    session_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const session = await grabUserBotSession({ session_id, user_id });

    if (!session?.id) {
        throw new AppError(`Session not found.`);
    }

    if (session.status == "active") return session;

    const now = Date.now();
    const workspace_id = session.workspace_id || null;

    await BunSQLite.sql({
        sql: `DELETE FROM bot_sessions WHERE user_id = ? AND bot_id = ? AND workspace_id IS ? AND status = 'active'
            AND NOT EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = bot_sessions.id)`,
        values: [session.user_id!, session.bot_id!, workspace_id],
    });

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET status = 'closed', unread = 0, updated_at = ?
            WHERE user_id = ? AND bot_id = ? AND workspace_id IS ? AND status = 'active'`,
        values: [now, session.user_id!, session.bot_id!, workspace_id],
    });

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET status = 'active', updated_at = ? WHERE id = ?`,
        values: [now, session.id],
    });

    return { ...session, status: "active", updated_at: now };
}
