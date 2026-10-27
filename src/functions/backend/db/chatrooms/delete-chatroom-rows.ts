import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * A query for the ids of the rooms to delete, with its values.
     */
    rooms: { sql: string; values: (string | number)[] };
};

/**
 * Deletes rooms with their bots' sessions there, the messages and jobs in
 * them. Explicitly, child rows first, since foreign keys are off outside
 * the server process. A room's outcome already posted into the asking
 * bot's own conversation stays there.
 */
export default async function deleteChatroomRows({ rooms }: Params) {
    const ids = ((await BunSQLite.sql<{ id: number }>({ sql: rooms.sql, values: rooms.values })).payload || []).map(
        (row) => Number(row.id),
    );

    if (!ids.length) return [];

    const list = ids.join(", ");
    const sessions = `SELECT id FROM bot_sessions WHERE chatroom_id IN (${list})`;

    await BunSQLite.sql({
        sql: `DELETE FROM bots_queue_updates WHERE bots_queue_id IN (SELECT id FROM bots_queue WHERE session_id IN (${sessions}))`,
    });
    await BunSQLite.sql({ sql: `DELETE FROM bots_queue WHERE session_id IN (${sessions})` });
    await BunSQLite.sql({ sql: `DELETE FROM bot_tasks WHERE session_id IN (${sessions})` });
    await BunSQLite.sql({
        sql: `DELETE FROM bot_message_reactions WHERE message_id IN (SELECT id FROM bot_messages WHERE session_id IN (${sessions}))`,
    });
    await BunSQLite.sql({
        sql: `DELETE FROM bot_message_media WHERE message_id IN (SELECT id FROM bot_messages WHERE session_id IN (${sessions}))`,
    });
    await BunSQLite.sql({ sql: `DELETE FROM bot_messages WHERE session_id IN (${sessions})` });
    await BunSQLite.sql({ sql: `DELETE FROM bot_sessions WHERE chatroom_id IN (${list})` });
    await BunSQLite.sql({ sql: `DELETE FROM chatrooms WHERE id IN (${list})` });

    return ids;
}
