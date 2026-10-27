import type { BUN_SQLITE_COBBLE_BOT_MESSAGES, BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import type { PastSessionScope } from "./past-session-messages-sql";

type Params = PastSessionScope & {
    /**
     * Read around this message (and in its session).
     */
    message_id?: number | null;
    /**
     * Read this session from its start, or from after `after_id`. Left
     * out (with no `message_id`): the session the current one carries on
     * from.
     */
    session_id?: number | null;
    after_id?: number | null;
    /**
     * Messages to return (around a message: about half before it).
     */
    limit: number;
};

export type PastSessionRead = {
    session: Pick<BUN_SQLITE_COBBLE_BOT_SESSIONS, "id" | "title" | "previous_session_id">;
    messages: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "id" | "author" | "text" | "created_at">[];
    /**
     * More of the session comes after the last message returned.
     */
    has_more: boolean;
};

/**
 * Reads messages of one of the conversation's earlier sessions, oldest
 * first: around a message, or a session in order. A session outside the
 * conversation (another user's, another bot's, another place's) or the
 * one being answered is never read.
 */
export default async function grabPastSessionMessages({
    user_id,
    bot_id,
    workspace_id,
    current_session_id,
    message_id,
    session_id,
    after_id,
    limit,
}: Params): Promise<PastSessionRead> {
    const target_session_id = message_id
        ? (
              await BunSQLite.sql<{ session_id: number }>({
                  sql: `SELECT session_id FROM bot_messages WHERE id = ? LIMIT 1`,
                  values: [message_id],
              })
          ).payload?.[0]?.session_id
        : session_id ||
          (
              await BunSQLite.sql<{ previous_session_id: number }>({
                  sql: `SELECT previous_session_id FROM bot_sessions WHERE id = ? LIMIT 1`,
                  values: [current_session_id],
              })
          ).payload?.[0]?.previous_session_id;

    if (!target_session_id) {
        throw new AppError(
            message_id
                ? `Message #${message_id} wasn't found.`
                : `This session doesn't carry on from an earlier one. Name a session, or search with search_past_sessions.`,
        );
    }

    const session = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
            sql: `SELECT id, title, previous_session_id FROM bot_sessions
                WHERE id = ? AND user_id = ? AND bot_id = ? AND workspace_id IS ? AND id != ? AND chatroom_id IS NULL LIMIT 1`,
            values: [
                target_session_id,
                user_id,
                bot_id,
                workspace_id ? Number(workspace_id) : null,
                current_session_id,
            ],
        })
    ).payload?.[0];

    if (!session?.id) {
        throw new AppError(`That isn't an earlier session of this conversation.`);
    }

    const columns = `id, author, text, created_at`;
    let messages: PastSessionRead["messages"];
    let has_more: boolean;

    if (message_id) {
        const before = Math.floor(limit / 2);
        const earlier =
            (
                await BunSQLite.sql<PastSessionRead["messages"][number]>({
                    sql: `SELECT ${columns} FROM bot_messages WHERE session_id = ? AND id < ? ORDER BY id DESC LIMIT ?`,
                    values: [session.id, message_id, before],
                })
            ).payload || [];
        const later =
            (
                await BunSQLite.sql<PastSessionRead["messages"][number]>({
                    sql: `SELECT ${columns} FROM bot_messages WHERE session_id = ? AND id >= ? ORDER BY id ASC LIMIT ?`,
                    values: [session.id, message_id, limit - before + 1],
                })
            ).payload || [];

        has_more = later.length > limit - before;
        messages = [...earlier.reverse(), ...later.slice(0, limit - before)];
    } else {
        const rows =
            (
                await BunSQLite.sql<PastSessionRead["messages"][number]>({
                    sql: `SELECT ${columns} FROM bot_messages WHERE session_id = ? AND id > ? ORDER BY id ASC LIMIT ?`,
                    values: [session.id, after_id || 0, limit + 1],
                })
            ).payload || [];

        has_more = rows.length > limit;
        messages = rows.slice(0, limit);
    }

    return { session, messages, has_more };
}
