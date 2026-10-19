import type {
    BUN_SQLITE_COBBLE_BOT_SESSIONS,
    BunSQLiteTables,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The session this one carries on from.
     */
    previous_session_id?: number | null;
};

/**
 * Starts an active session in a conversation. Callers close the old one
 * first (`startBotSession`).
 */
export default async function createBotSession({
    bot_id,
    workspace_id,
    previous_session_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const now = Date.now();

    const row: BUN_SQLITE_COBBLE_BOT_SESSIONS = {
        bot_id: Number(bot_id),
        workspace_id: workspace_id ? Number(workspace_id) : undefined,
        previous_session_id: previous_session_id || undefined,
        status: "active",
        unread: 0,
        last_activity_at: now,
    };

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_SESSIONS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bot_sessions",
        data: [row],
    });

    const id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Couldn't start a session: ${res.msg}`);
    }

    return { ...row, id, created_at: now, updated_at: now };
}
