import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabWorkspaceComputers from "./grab-workspace-computers";
import grabUserWorkspace from "./grab-user-workspace";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    computer_id: number | string;
};

/**
 * Makes one of a workspace's computers its default, where its tasks run.
 * Returns the workspace's computers, the new default first.
 */
export default async function setWorkspaceComputer({
    user_id,
    workspace_id,
    computer_id,
}: Params) {
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

    const linked = await grabWorkspaceComputers({ workspace_id: workspace.id });
    const computer = linked.find((c) => String(c.id) == String(computer_id));

    if (!computer?.id) {
        throw new AppError(`That computer isn't in ${workspace.name || "this workspace"}.`);
    }

    await BunSQLite.sql({
        sql: `UPDATE workspaces SET computer_id = ?, updated_at = ? WHERE id = ?`,
        values: [computer.id, Date.now(), workspace.id],
    });

    return {
        workspace: { ...workspace, computer_id: computer.id },
        computer,
        computers: [computer, ...linked.filter((c) => c.id != computer.id)],
    };
}
