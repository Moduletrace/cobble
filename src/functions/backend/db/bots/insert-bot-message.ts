import type {
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BunSQLiteTables,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number;
    /**
     * The session it goes in, and that session's workspace.
     */
    session_id: number;
    workspace_id?: number | null;
    text: string;
    needs_you?: boolean;
};

/**
 * Appends a bot message to a session, marks the session unread and bumps
 * its activity. Callers must check the bot and session first.
 */
export default async function insertBotMessage({
    bot_id,
    session_id,
    workspace_id,
    text,
    needs_you,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES> {
    const now = Date.now();
    const needs_you_flag = needs_you ? 1 : 0;

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_MESSAGES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bot_messages",
        data: [
            {
                bot_id,
                session_id,
                workspace_id: workspace_id || undefined,
                author: "bot",
                text,
                needs_you: needs_you_flag,
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Failed to save message: ${res.msg}`);
    }

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET last_activity_at = ?, unread = 1 WHERE id = ?`,
        values: [now, session_id],
    });

    return {
        id,
        bot_id,
        session_id,
        workspace_id: workspace_id || undefined,
        author: "bot",
        text,
        needs_you: needs_you_flag,
        created_at: now,
        updated_at: now,
    };
}
