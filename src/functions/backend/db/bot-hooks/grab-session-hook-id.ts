import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id?: number | string | null;
};

/**
 * The hook whose runs a session holds, or null for any other session.
 */
export default async function grabSessionHookId({ session_id }: Params) {
    if (!session_id) return null;

    const hook_id = (
        await BunSQLite.sql<{ hook_id: number | null }>({
            sql: `SELECT hook_id FROM bot_sessions WHERE id = ? LIMIT 1`,
            values: [session_id],
        })
    ).payload?.[0]?.hook_id;

    return hook_id ? Number(hook_id) : null;
}
