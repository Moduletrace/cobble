import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Notes that the user opened a conversation with a bot, in its own chat or
 * a workspace (`bot_user_visits`), so the rail lists it by when they were
 * last there. Callers must have checked the user reaches it.
 */
export default async function recordBotVisit({ user_id, bot_id }: Params) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT INTO bot_user_visits (created_at, updated_at, bot_id, user_id, visited_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(bot_id, user_id) DO UPDATE SET visited_at = excluded.visited_at, updated_at = excluded.updated_at`,
        values: [now, now, bot_id, user_id, now],
    });
}
