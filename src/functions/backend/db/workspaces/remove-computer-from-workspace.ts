import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserWorkspace from "./grab-user-workspace";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    computer_id: number | string;
};

/**
 * Unlinks a computer from one of the user's workspaces; the computer
 * itself stays. When it was the default, the oldest computer still linked
 * takes over (none: the workspace has no computer).
 */
export default async function removeComputerFromWorkspace({
    user_id,
    workspace_id,
    computer_id,
}: Params) {
    await assertCrewManager({ user_id });

    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

    await BunSQLite.sql({
        sql: `DELETE FROM workspace_computers WHERE workspace_id = ? AND computer_id = ?`,
        values: [workspace.id, computer_id],
    });

    if (String(workspace.computer_id) == String(computer_id)) {
        await BunSQLite.sql({
            sql: `UPDATE workspaces SET updated_at = ?, computer_id = (
                SELECT computer_id FROM workspace_computers WHERE workspace_id = ? ORDER BY id ASC LIMIT 1
            ) WHERE id = ?`,
            values: [Date.now(), workspace.id, workspace.id],
        });
    }
}
