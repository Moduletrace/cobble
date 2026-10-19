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
     * Files to attach, already checked to be the user's own
     * (`grabAttachableMedia`).
     */
    media?: BUN_SQLITE_COBBLE_MEDIA[];
};

/**
 * Appends a user message (and its files) to a session and bumps its
 * activity. The first one titles the session. Callers must check the bot
 * and session belong to the session user first.
 */
export default async function insertUserMessage({
    bot_id,
    session_id,
    workspace_id,
    text,
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

    const title = (text || media[0]?.title || "").replace(/\s+/g, " ").trim().slice(0, 80);

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET last_activity_at = ?,
            title = CASE WHEN COALESCE(title, '') = '' THEN ? ELSE title END
            WHERE id = ?`,
        values: [now, title, session_id],
    });

    return {
        id,
        bot_id,
        session_id,
        workspace_id: workspace_id || undefined,
        author: "user",
        text,
        needs_you: 0,
        created_at: now,
        updated_at: now,
        attachments: media.map((file) => mediaToAttachment({ media: file })),
    };
}
