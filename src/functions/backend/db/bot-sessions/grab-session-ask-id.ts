import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
};

/**
 * The crew request a session is one bot's part of, if it is one.
 */
export default async function grabSessionAskId({ session_id }: Params) {
    const res = await BunSQLite.sql<{ ask_id: number | null }>({
        sql: `SELECT ask_id FROM bot_sessions WHERE id = ?`,
        values: [Number(session_id)],
    });

    return Number(res.payload?.[0]?.ask_id) || null;
}