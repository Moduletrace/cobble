import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number | string;
    message_id: number | string;
};

/**
 * A message in one of the user's own sessions, whoever wrote it. Throws
 * when it isn't theirs.
 */
export default async function grabUserBotMessage({
    user_id,
    message_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES> {
    const message = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
            sql: `SELECT m.* FROM bot_messages m
                JOIN bot_sessions s ON s.id = m.session_id
                WHERE m.id = ? AND s.user_id = ? LIMIT 1`,
            values: [message_id, user_id],
        })
    ).payload?.[0];

    if (!message?.id) {
        throw new AppError(`Message not found`);
    }

    return message;
}
