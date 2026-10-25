import type {
    BUN_SQLITE_COBBLE_BOT_SESSIONS,
    BunSQLiteTables,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The user the conversation is with.
     */
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The session this one carries on from.
     */
    previous_session_id?: number | null;
    /**
     * `closed` starts it in the background (a hook's own session), leaving
     * the conversation's active one as it is. Active by default.
     */
    status?: "active" | "closed";
    title?: string | null;
};

/**
 * Starts a session in a user's conversation: an active one (callers close
 * the old one first, `startBotSession`) or, `closed`, one beside it.
 */
export default async function createBotSession({
    user_id,
    bot_id,
    workspace_id,
    previous_session_id,
    status = "active",
    title,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const now = Date.now();

    const row: BUN_SQLITE_COBBLE_BOT_SESSIONS = {
        user_id: Number(user_id),
        bot_id: Number(bot_id),
        workspace_id: workspace_id ? Number(workspace_id) : undefined,
        previous_session_id: previous_session_id || undefined,
        status,
        title: title || undefined,
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
