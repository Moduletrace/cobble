import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    /**
     * Null or undefined: the bot's own chat.
     */
    workspace_id?: number | string | null;
};

/**
 * The active session of one conversation (a bot in its own chat or in one
 * workspace), or null when it has none yet.
 */
export default async function grabActiveBotSession({
    bot_id,
    workspace_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
        sql: `SELECT * FROM bot_sessions
            WHERE bot_id = ? AND workspace_id IS ? AND status = 'active'
            ORDER BY id DESC LIMIT 1`,
        values: [bot_id, workspace_id ? Number(workspace_id) : null],
    });

    return res.payload?.[0] || null;
}
