import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import createBotSession from "./create-bot-session";
import grabActiveBotSession from "./grab-active-bot-session";

type Params = {
    bot_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * Closes the conversation's active session and starts the next one, which
 * carries on from it (its summary is written when the next reply runs).
 * An active session with no messages yet is kept as it is.
 */
export default async function startBotSession({
    bot_id,
    workspace_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const active = await grabActiveBotSession({ bot_id, workspace_id });

    if (active?.id) {
        const has_messages = (
            await BunSQLite.sql({
                sql: `SELECT id FROM bot_messages WHERE session_id = ? LIMIT 1`,
                values: [active.id],
            })
        ).payload?.[0];

        if (!has_messages) return active;

        await BunSQLite.sql({
            sql: `UPDATE bot_sessions SET status = 'closed', unread = 0, updated_at = ? WHERE id = ?`,
            values: [Date.now(), active.id],
        });
    }

    return await createBotSession({
        bot_id,
        workspace_id,
        previous_session_id: active?.id || null,
    });
}
