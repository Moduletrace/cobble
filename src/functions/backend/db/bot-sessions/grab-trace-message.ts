import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES, BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";

type Params = {
    message_id: number;
    user_id: number;
    user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
};

/**
 * A bot message whose run's trace the caller may read: one in a session
 * that's theirs, or any of them for a super admin. Null when it isn't.
 */
export default async function grabTraceMessage({
    message_id,
    user_id,
    user_types,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES | null> {
    const message = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES & { session_user_id: number | null }>({
            sql: `SELECT m.*, s.user_id AS session_user_id
                FROM bot_messages m
                JOIN bot_sessions s ON s.id = m.session_id
                WHERE m.id = ? AND m.author = 'bot'`,
            values: [message_id],
        })
    ).payload?.[0];

    if (!message?.id) return null;

    if (Number(message.session_user_id) == Number(user_id)) return message;

    if (isPassThroughUser({ user_types })) return message;

    return null;
}