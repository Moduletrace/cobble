import type {
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_MEDIA,
    BunSQLiteTables,
} from "@/db/types/db";
import type { BotMessageWithAttachments } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import mediaToAttachment from "./media-to-attachment";

type Params = {
    bot_id: number;
    text: string;
    /**
     * Files to attach, already checked to be the user's own
     * (`grabAttachableMedia`).
     */
    media?: BUN_SQLITE_COBBLE_MEDIA[];
};

/**
 * Appends a user message (and its files) to a bot's conversation and
 * bumps its activity. Callers must check the bot belongs to the session
 * user first.
 */
export default async function insertUserMessage({
    bot_id,
    text,
    media = [],
}: Params): Promise<BotMessageWithAttachments> {
    const now = Date.now();

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_MESSAGES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bot_messages",
        data: [{ bot_id, author: "user", text, needs_you: 0 }],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Failed to save message: ${res.msg}`);
    }

    for (const file of media) {
        await BunSQLite.sql({
            sql: `INSERT INTO bot_message_media (created_at, updated_at, message_id, media_id) VALUES (?, ?, ?, ?)`,
            values: [now, now, id, file.id!],
        });
    }

    await BunSQLite.sql({
        sql: `UPDATE bots SET last_activity_at = ? WHERE id = ?`,
        values: [now, bot_id],
    });

    return {
        id,
        bot_id,
        author: "user",
        text,
        needs_you: 0,
        created_at: now,
        updated_at: now,
        attachments: media.map((file) => mediaToAttachment({ media: file })),
    };
}
