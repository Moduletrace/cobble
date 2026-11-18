import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id?: number | string | null;
};

/**
 * Whether a session is a silent hook's thread. Its runs are followed by
 * nobody: they change no face and are pushed nowhere. A hook that isn't
 * silent takes the conversation over instead, so its runs show like any
 * other and this is false for them.
 */
export default async function isUnattendedHookSession({ session_id }: Params) {
    if (!session_id) return false;

    const res = await BunSQLite.sql<{ unattended: number }>({
        sql: `SELECT (h.id IS NOT NULL AND h.silent = 1) AS unattended
            FROM bot_sessions s LEFT JOIN bot_hooks h ON h.id = s.hook_id
            WHERE s.id = ? LIMIT 1`,
        values: [Number(session_id)],
    });

    return res.payload?.[0]?.unattended == 1;
}