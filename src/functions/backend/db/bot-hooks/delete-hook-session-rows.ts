import BunSQLite from "@moduletrace/bun-sqlite";
import deleteUnlinkedAttachmentMedia from "../media/delete-unlinked-attachment-media";

type Params = {
    /**
     * Only this hook's. Left out: every hidden session whose hook is gone.
     */
    hook_id?: number | string;
};

/**
 * Deletes hooks' hidden sessions with what's in them. Explicitly, child
 * rows first, since foreign keys are off outside the server process. A
 * session with a run still open stays until that run ends (a deleted
 * hook's run carries on), and the daily prune takes it then.
 */
export default async function deleteHookSessionRows({ hook_id }: Params) {
    const res = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT s.id FROM bot_sessions s WHERE s.hook_id IS NOT NULL
            AND ${hook_id ? `s.hook_id = ?` : `s.hook_id NOT IN (SELECT id FROM bot_hooks)`}
            AND NOT EXISTS (SELECT 1 FROM bots_queue q WHERE q.session_id = s.id AND q.status IN ('pending', 'processing'))`,
        values: hook_id ? [Number(hook_id)] : [],
    });

    const list = (res.payload || []).map((row) => Number(row.id)).join(", ");

    if (!list) return;

    const messages = `SELECT id FROM bot_messages WHERE session_id IN (${list})`;

    await BunSQLite.sql({
        sql: `DELETE FROM bots_queue_updates WHERE bots_queue_id IN (SELECT id FROM bots_queue WHERE session_id IN (${list}))`,
    });
    await BunSQLite.sql({ sql: `DELETE FROM bots_queue WHERE session_id IN (${list})` });
    await BunSQLite.sql({ sql: `DELETE FROM bot_tasks WHERE session_id IN (${list})` });
    await BunSQLite.sql({ sql: `DELETE FROM bot_message_reactions WHERE message_id IN (${messages})` });

    /**
     * An upload's bytes are its `media` row, which the message's link was
     * the only way to reach.
     */
    const uploads = await BunSQLite.sql<{ media_id: number }>({
        sql: `SELECT media_id FROM bot_message_media WHERE message_id IN (${messages})`,
    });

    await BunSQLite.sql({ sql: `DELETE FROM bot_message_media WHERE message_id IN (${messages})` });

    await deleteUnlinkedAttachmentMedia({ media_ids: (uploads.payload || []).map((row) => Number(row.media_id)) }).catch(() => []);
    await BunSQLite.sql({ sql: `DELETE FROM bot_messages WHERE session_id IN (${list})` });
    await BunSQLite.sql({ sql: `DELETE FROM bot_sessions WHERE id IN (${list})` });
}
