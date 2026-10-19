import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotMessageWithAttachments } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import grabMessagesMedia from "./grab-messages-media";
import grabMessagesReactions from "./grab-messages-reactions";
import grabMessagesReplies from "./grab-messages-replies";
import mediaToAttachment from "./media-to-attachment";

type Params = {
    session_id: number | string;
    limit?: number;
    /**
     * Whose conversation it is, so a reaction can show as the user's own.
     * Left out for the bot's own history reads, which don't need it.
     */
    user_id?: number | string;
};

/**
 * The latest messages of a session, oldest first, with their attachments,
 * what each replies to, and (when `user_id` is given) its reactions.
 */
export default async function grabBotMessages({
    session_id,
    limit = 100,
    user_id,
}: Params): Promise<BotMessageWithAttachments[]> {
    let sql = ``;

    sql += `SELECT * FROM (\n`;
    sql += `    SELECT * FROM bot_messages\n`;
    sql += `    WHERE session_id = ?\n`;
    sql += `    ORDER BY created_at DESC, id DESC\n`;
    sql += `    LIMIT ?\n`;
    sql += `) ORDER BY created_at ASC, id ASC\n`;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
        sql,
        values: [session_id, limit],
    });

    const messages = res.payload || [];
    const message_ids = messages.map((message) => Number(message.id));

    const [media, replies, reactions] = await Promise.all([
        grabMessagesMedia({ message_ids }),
        grabMessagesReplies({ message_ids }),
        user_id
            ? grabMessagesReactions({ message_ids, user_id })
            : Promise.resolve(new Map()),
    ]);

    return messages.map((message) => {
        const id = Number(message.id);
        const files = media.get(id);
        const reply_to = replies.get(id);

        return {
            ...message,
            ...(files
                ? { attachments: files.map((file) => mediaToAttachment({ media: file })) }
                : {}),
            ...(reply_to ? { reply_to } : {}),
            ...(user_id ? { reactions: reactions.get(id) || [] } : {}),
        };
    });
}
