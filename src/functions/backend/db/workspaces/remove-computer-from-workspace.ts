import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserWorkspace from "./grab-user-workspace";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    computer_id: number | string;
};

/**
 * Takes a computer off one of the user's workspaces. Its bots keep any
 * access they were given directly.
 */
export default async function removeComputerFromWorkspace({
    user_id,
    workspace_id,
    computer_id,
}: Params) {
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

    await BunSQLite.sql({
        sql: `DELETE FROM workspace_computers WHERE workspace_id = ? AND computer_id = ?`,
        values: [workspace.id, computer_id],
    });
}
