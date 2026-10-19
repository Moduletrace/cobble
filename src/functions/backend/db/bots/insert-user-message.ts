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
    /**
     * The session it goes in, and that session's workspace.
     */
    session_id: number;
    workspace_id?: number | null;
    text: string;
    /**
     * The message this one answers, quoted above it. Already checked to
     * be in the same conversation.
     */
    reply_to?: BUN_SQLITE_COBBLE_BOT_MESSAGES | null;
    /**
     * Files to attach, already checked to be the user's own
     * (`grabAttachableMedia`).
     */
    media?: BUN_SQLITE_COBBLE_MEDIA[];
};

/**
 * Appends a user message (and its files) to a session and bumps its
 * activity. The session is named later, from its first exchange with the
 * bot (`nameBotSession`). Callers must check the bot and session belong to
 * the session user first.
 */
export default async function insertUserMessage({
    bot_id,
    session_id,
    workspace_id,
    text,
    reply_to,
    media = [],
}: Params): Promise<BotMessageWithAttachments> {
    const now = Date.now();

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_MESSAGES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bot_messages",
        data: [
            {
                bot_id,
                session_id,
                workspace_id: workspace_id || undefined,
                author: "user",
                text,
                needs_you: 0,
                reply_to_message_id: reply_to?.id || undefined,
            },
        ],
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
        sql: `UPDATE bot_sessions SET last_activity_at = ? WHERE id = ?`,
        values: [now, session_id],
    });

    return {
        id,
        bot_id,
        session_id,
        workspace_id: workspace_id || undefined,
        author: "user",
        text,
        needs_you: 0,
        reply_to_message_id: reply_to?.id || undefined,
        created_at: now,
        updated_at: now,
        attachments: media.map((file) => mediaToAttachment({ media: file })),
        reply_to: reply_to
            ? {
                  id: Number(reply_to.id),
                  author: reply_to.author == "bot" ? "bot" : "user",
                  text: reply_to.text || "",
              }
            : null,
    };
}
