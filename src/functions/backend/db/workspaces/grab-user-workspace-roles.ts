import BunSQLite from "@moduletrace/bun-sqlite";
import type { WorkspaceUserRoles } from "@/src/types";

type Params = {
    user_id: number | string;
};

/**
 * A user's roles in every workspace one was set for, keyed by workspace
 * id. Includes workspaces they no longer reach (a role stays when access
 * is taken away, for when it's given back); callers show only the ones
 * they work in.
 */
export default async function grabUserWorkspaceRoles({ user_id }: Params): Promise<WorkspaceUserRoles> {
    const res = await BunSQLite.sql<{ workspace_id: number; role: string | null }>({
        sql: `SELECT workspace_id, role FROM workspace_user_roles WHERE user_id = ?`,
        values: [user_id],
    });

    const roles: WorkspaceUserRoles = {};

    for (const row of res.payload || []) {
        if (row.role?.trim()) roles[String(row.workspace_id)] = row.role.trim();
    }

    return roles;
}
