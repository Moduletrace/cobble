import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import grabUserConversation from "../bot-sessions/grab-user-conversation";

type Params = {
    user_id: number;
    message_id: number;
};

/**
 * A bot message in one of the user's own sessions, for reading aloud,
 * with the conversation it's in (so a lost grant blocks it). Throws when
 * it isn't theirs.
 */
export default async function grabSpeakableMessage({ user_id, message_id }: Params) {
    const message = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
            sql: `SELECT m.* FROM bot_messages m
                JOIN bot_sessions s ON s.id = m.session_id
                WHERE m.id = ? AND m.author = 'bot' AND s.user_id = ?`,
            values: [message_id, user_id],
        })
    ).payload?.[0];

    if (!message?.id || !message.bot_id) {
        throw new AppError(`Message not found`);
    }

    const conversation = await grabUserConversation({
        user_id,
        bot_id: message.bot_id,
        workspace_id: message.workspace_id || null,
    });

    return { message, conversation };
}
