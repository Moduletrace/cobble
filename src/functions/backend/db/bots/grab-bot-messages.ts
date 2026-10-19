import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotMessageWithAttachments } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import grabMessagesMedia from "./grab-messages-media";
import mediaToAttachment from "./media-to-attachment";

type Params = {
    session_id: number | string;
    limit?: number;
};

/**
 * The latest messages of a session, oldest first, with their attachments.
 */
export default async function grabBotMessages({
    session_id,
    limit = 100,
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
    const media = await grabMessagesMedia({
        message_ids: messages.map((message) => Number(message.id)),
    });

    return messages.map((message) => {
        const files = media.get(Number(message.id));

        return files
            ? { ...message, attachments: files.map((file) => mediaToAttachment({ media: file })) }
            : message;
    });
}
