import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
};

/**
 * Notes that the user opened a workspace (`workspace_user_visits`), so the
 * rail lists it by when they were last there. Callers must have checked
 * the user reaches it.
 */
export default async function recordWorkspaceVisit({ user_id, workspace_id }: Params) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT INTO workspace_user_visits (created_at, updated_at, workspace_id, user_id, visited_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(workspace_id, user_id) DO UPDATE SET visited_at = excluded.visited_at, updated_at = excluded.updated_at`,
        values: [now, now, workspace_id, user_id, now],
    });
}
