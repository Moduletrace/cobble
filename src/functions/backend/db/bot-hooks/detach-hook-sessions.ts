import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The hook being deleted. Left out: every session whose hook is
     * already gone.
     */
    hook_id?: number | string | null;
};

/**
 * Lets a hook's sessions go without deleting them: they're the user's own
 * threads now (`hook_id` null, a `hook` status row closed like any other),
 * so they stay in the session list and can be reopened. A run already
 * queued carries on there.
 */
export default async function detachHookSessions({ hook_id }: Params = {}) {
    const res = await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET
                hook_id = NULL,
                status = CASE WHEN status = 'hook' THEN 'closed' ELSE status END,
                updated_at = ?
            WHERE hook_id IS NOT NULL
                ${hook_id ? "AND hook_id = ?" : "AND NOT EXISTS (SELECT 1 FROM bot_hooks h WHERE h.id = bot_sessions.hook_id)"}`,
        values: hook_id ? [Date.now(), Number(hook_id)] : [Date.now()],
    });

    if (!res.success) {
        throw new Error(`Couldn't detach the hook's sessions: ${res.error}`);
    }
}