import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
    user_id: number | string;
};

/**
 * The session a closed session of the user's was carried into
 * (`carryOverBotSession`), or null when it wasn't carried over.
 */
export default async function grabCarriedToSessionId({ session_id, user_id }: Params): Promise<number | null> {
    const carried = (
        await BunSQLite.sql<{ session_id: number }>({
            sql: `SELECT m.session_id FROM bot_messages m JOIN bot_sessions s ON s.id = m.session_id
                WHERE m.carried_from_session_id = ? AND s.user_id = ? ORDER BY m.id DESC LIMIT 1`,
            values: [session_id, user_id],
        })
    ).payload?.[0];

    return carried?.session_id ? Number(carried.session_id) : null;
}
