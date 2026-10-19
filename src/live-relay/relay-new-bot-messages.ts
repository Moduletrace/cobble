import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import grabMessagesReplies from "@/src/functions/backend/db/bots/grab-messages-replies";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    after_id: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-message` for every message newer than `after_id` to
 * the sockets on this process of the user whose conversation it's in,
 * with the message a reply quotes. Returns the newest id read.
 */
export default async function relayNewBotMessages({ after_id, users }: Params) {
    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES & { user_id: number }>({
                sql: `SELECT m.*, s.user_id FROM bot_messages m JOIN bot_sessions s ON s.id = m.session_id
                    WHERE m.id > ? ORDER BY m.id ASC LIMIT 500`,
                values: [after_id],
            })
        ).payload || [];

    const replies = await grabMessagesReplies({
        message_ids: rows
            .filter((row) => row.reply_to_message_id && users.has(String(row.user_id)))
            .map((row) => Number(row.id)),
    });

    for (const { user_id, ...message } of rows) {
        if (users.has(String(user_id))) {
            const reply_to = replies.get(Number(message.id));

            sendToUser({
                user_id,
                data: {
                    event: "server:bot-message",
                    data: reply_to ? { ...message, reply_to } : message,
                },
            });
        }
    }

    return Number(rows[rows.length - 1]?.id) || after_id;
}
