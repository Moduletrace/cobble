import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotMessageWithAttachments } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import grabMessageUsage from "../usage/grab-message-usage";
import grabMessagesMedia from "./grab-messages-media";
import grabMessagesReactions from "./grab-messages-reactions";
import grabMessagesReplies from "./grab-messages-replies";
import mediaToAttachment, { grabAttachmentFileIds } from "./media-to-attachment";

type Params = {
    session_id: number | string;
    limit?: number;
    /**
     * Only messages older than this one, for loading further back.
     */
    before_id?: number | null;
    /**
     * Only messages saved after this one (by id, which is insertion
     * order), for what arrived while a reply ran.
     */
    after_id?: number | null;
    /**
     * Only one side's messages.
     */
    author?: "user" | "bot";
    /**
     * Whose conversation it is, so a reaction can show as the user's own.
     * Left out for the bot's own history reads, which don't need it.
     */
    user_id?: number | string;
};

/**
 * The latest messages of a session (or the latest before `before_id`),
 * oldest first, with their attachments,
 * what each replies to, and (when `user_id` is given) its reactions.
 */
export default async function grabBotMessages({
    session_id,
    limit = 100,
    before_id,
    after_id,
    author,
    user_id,
}: Params): Promise<BotMessageWithAttachments[]> {
    let sql = ``;
    const values: (string | number)[] = [session_id];

    sql += `SELECT * FROM (\n`;
    sql += `    SELECT * FROM bot_messages\n`;
    sql += `    WHERE session_id = ?\n`;

    if (before_id) {
        sql += `    AND (created_at, id) < (SELECT created_at, id FROM bot_messages WHERE id = ?)\n`;
        values.push(before_id);
    }

    if (after_id) {
        sql += `    AND id > ?\n`;
        values.push(after_id);
    }

    if (author) {
        sql += `    AND author = ?\n`;
        values.push(author);
    }

    sql += `    ORDER BY created_at DESC, id DESC\n`;
    sql += `    LIMIT ?\n`;
    sql += `) ORDER BY created_at ASC, id ASC\n`;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
        sql,
        values: [...values, limit],
    });

    const messages = res.payload || [];
    const message_ids = messages.map((message) => Number(message.id));

    const [media, replies, reactions, usage] = await Promise.all([
        grabMessagesMedia({ message_ids }),
        grabMessagesReplies({ message_ids }),
        user_id
            ? grabMessagesReactions({ message_ids, user_id })
            : Promise.resolve(new Map()),
        grabMessageUsage({ message_ids }),
    ]);

    /**
     * Files that live in a bot's folder carry their `bot_files` id, so a
     * chip opens the file rather than only its bytes.
     */
    const file_ids = await grabAttachmentFileIds({
        media_ids: [...media.values()].flat().map((file) => Number(file.id)),
    });

    return messages.map((message) => {
        const id = Number(message.id);
        const files = media.get(id);
        const reply_to = replies.get(id);

        const spent = usage.get(id);

        return {
            ...message,
            ...(files
                ? {
                      attachments: files.map((file) =>
                          mediaToAttachment({
                              media: file,
                              file_id: file_ids.get(Number(file.id)),
                          }),
                      ),
                  }
                : {}),
            ...(reply_to ? { reply_to } : {}),
            ...(user_id ? { reactions: reactions.get(id) || [] } : {}),
            ...(spent ? { usage: spent } : {}),
        };
    });
}
