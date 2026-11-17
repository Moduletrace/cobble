import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | null;
    client_id: string;
};

/**
 * The id of the message a send already stored under the composer's own id,
 * or null when that send never landed. Scoped to the user, the bot and the
 * place, and searched over every session of that conversation, since the
 * send that stored it may have rolled the next one onto a new session.
 */
export default async function grabMessageIdByClientId({
    user_id,
    bot_id,
    workspace_id,
    client_id,
}: Params): Promise<number | null> {
    const row = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT m.id FROM bot_messages m
                JOIN bot_sessions s ON s.id = m.session_id
                WHERE m.client_id = ? AND m.bot_id = ? AND m.author = 'user' AND s.user_id = ?
                    AND COALESCE(m.workspace_id, 0) = COALESCE(?, 0)
                ORDER BY m.id DESC LIMIT 1`,
            values: [
                client_id,
                Number(bot_id),
                Number(user_id),
                workspace_id ? Number(workspace_id) : null,
            ],
        })
    ).payload?.[0];

    return Number(row?.id) || null;
}