import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import canSetWorkspaceUserRole from "@/src/utils/rbac/can-set-workspace-user-role";
import grabUsers from "../users/grab-users";
import grabUserTypes from "../users/grab-user-types";
import grabUserWorkspace from "./grab-user-workspace";

type Params = {
    /**
     * Who sets it: a crew manager, and only the super admin for a super
     * admin (`canSetWorkspaceUserRole`).
     */
    actor_user_id: number | string;
    workspace_id: number | string;
    /**
     * Whose role it is. They must work in the workspace.
     */
    user_id: number | string;
    /**
     * Empty clears it.
     */
    role: string;
};

/**
 * Sets (or clears) who a user is in one workspace, which every bot there
 * reads when it works for them. Checks the actor may, and that the user
 * works in the workspace. Returns the role as saved, or null.
 */
export default async function setWorkspaceUserRole({ actor_user_id, workspace_id, user_id, role }: Params) {
    const [actor_user_types, target_user_types] = await Promise.all([
        grabUserTypes({ user_id: actor_user_id }),
        grabUserTypes({ user_id }),
    ]);

    if (!canSetWorkspaceUserRole({ actor_user_types, target_user_types })) {
        throw new AppError(
            target_user_types.some((type) => type.user_type == "super_admin")
                ? `Only the super admin sets their own role.`
                : `Only an admin can do that.`,
        );
    }

    const target = (await grabUsers({ user_id })).singleRes;

    if (!target?.id) {
        throw new AppError(`There's no such user.`);
    }

    const workspace = await grabUserWorkspace({ workspace_id, user_id: target.id });

    if (!workspace?.id) {
        throw new AppError(`${target.first_name || "This user"} doesn't work in that workspace.`);
    }

    const text = role.trim();

    if (!text) {
        await BunSQLite.sql({
            sql: `DELETE FROM workspace_user_roles WHERE workspace_id = ? AND user_id = ?`,
            values: [workspace.id, target.id],
        });

        return null;
    }

    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `INSERT INTO workspace_user_roles (created_at, updated_at, workspace_id, user_id, role, updated_by)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(workspace_id, user_id) DO UPDATE SET
                updated_at = excluded.updated_at, role = excluded.role, updated_by = excluded.updated_by`,
        values: [now, now, workspace.id, target.id, text, actor_user_id],
    });

    if (!res.success) {
        throw new Error(`Couldn't save the role: ${res.error}`);
    }

    return text;
}
