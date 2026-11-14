import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import grabMessagesReplies from "@/src/functions/backend/db/bots/grab-messages-replies";
import withMessageUsage from "@/src/functions/backend/db/usage/with-message-usage";
import withMessageTasks from "@/src/functions/backend/db/bots/with-message-tasks";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    after_id: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-message` for every message newer than `after_id` to
 * the sockets on this process of the user whose conversation it's in,
 * with the message a reply quotes. Nothing for a message in a hidden
 * session (a crew request's, a hook's): those show there, never in a
 * conversation. Returns the newest id read.
 */
export default async function relayNewBotMessages({ after_id, users }: Params) {
    const read =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES & { user_id: number; ask_id: number | null; hook_id: number | null }>({
                sql: `SELECT m.*, s.user_id, s.ask_id, s.hook_id FROM bot_messages m JOIN bot_sessions s ON s.id = m.session_id
                    WHERE m.id > ? ORDER BY m.id ASC LIMIT 500`,
                values: [after_id],
            })
        ).payload || [];

    /**
     * With what each one spent, like a loaded message, so the thread shows
     * its tokens without a reload.
     */
    const spent = await withMessageUsage({
        messages: read.filter((row) => users.has(String(row.user_id))),
    });

    /**
     * And the tracker tasks each one is about, as its own user sees them.
     */
    const rows = (
        await Promise.all(
            [...new Set(spent.map((row) => row.user_id))].map((user_id) =>
                withMessageTasks({ messages: spent.filter((row) => row.user_id == user_id), user_id }),
            ),
        )
    )
        .flat()
        .sort((a, b) => Number(a.id) - Number(b.id));

    const replies = await grabMessagesReplies({
        message_ids: rows
            .filter((row) => row.reply_to_message_id)
            .map((row) => Number(row.id)),
    });

    for (const { user_id, ask_id, hook_id, ...message } of rows) {
        const reply_to = replies.get(Number(message.id));

        /**
         * A hidden session's message (a crew request's, a hook's run's)
         * shows there, never in a conversation.
         */
        if (hook_id || ask_id) continue;

        sendToUser({
            user_id,
            data: {
                event: "server:bot-message",
                data: reply_to ? { ...message, reply_to } : message,
            },
        });
    }

    return Number(read[read.length - 1]?.id) || after_id;
}
