import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
};

/**
 * Whether a session is a crew request's or a hook's, which nobody follows.
 */
export default async function isHiddenSession({ session_id }: Params) {
    const res = await BunSQLite.sql<{ hidden: number }>({
        sql: `SELECT (ask_id IS NOT NULL OR hook_id IS NOT NULL) AS hidden FROM bot_sessions WHERE id = ?`,
        values: [Number(session_id)],
    });

    return res.payload?.[0]?.hidden != 0;
}
