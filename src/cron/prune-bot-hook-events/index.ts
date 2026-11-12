import BunSQLite from "@moduletrace/bun-sqlite";
import deleteHookSessionRows from "@/src/functions/backend/db/bot-hooks/delete-hook-session-rows";
import { grabHookEventsKeepDays } from "@/src/functions/backend/db/app-settings/grab-hook-events-keep-days";
import deleteUnlinkedAttachmentMedia from "@/src/functions/backend/db/media/delete-unlinked-attachment-media";

/**
 * Deletes hook calls (with their responses) older than the install's
 * retention (`grabHookEventsKeepDays`), the messages their runs left in
 * hooks' hidden sessions, and the sessions of hooks that are gone. Messages
 * a call posted into a chat before hooks had their own thread stay.
 */
export default async function pruneBotHookEvents() {
    const cutoff = Date.now() - (await grabHookEventsKeepDays()) * 24 * 60 * 60 * 1000;
    const messages = `SELECT m.id FROM bot_messages m JOIN bot_sessions s ON s.id = m.session_id
        WHERE s.hook_id IS NOT NULL AND m.id IN (SELECT response_message_id FROM bot_hook_events WHERE created_at < ?)`;

    await BunSQLite.sql({ sql: `DELETE FROM bot_message_reactions WHERE message_id IN (${messages})`, values: [cutoff] });

    /**
     * The call's uploads go with its messages: their `media` row is what
     * the deleted link was the only way to reach.
     */
    const uploads = await BunSQLite.sql<{ media_id: number }>({
        sql: `SELECT media_id FROM bot_message_media WHERE message_id IN (${messages})`,
        values: [cutoff],
    });

    await BunSQLite.sql({ sql: `DELETE FROM bot_message_media WHERE message_id IN (${messages})`, values: [cutoff] });

    await deleteUnlinkedAttachmentMedia({ media_ids: (uploads.payload || []).map((row) => Number(row.media_id)) }).catch(() => []);
    await BunSQLite.sql({ sql: `DELETE FROM bot_messages WHERE id IN (${messages})`, values: [cutoff] });

    await deleteHookSessionRows({});

    return await BunSQLite.sql({
        sql: `DELETE FROM bot_hook_events WHERE created_at < ? RETURNING id`,
        values: [cutoff],
    });
}
