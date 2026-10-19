import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserComputer from "../computers/grab-user-computer";
import grabUserWorkspace from "./grab-user-workspace";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    computer_id: number | string;
};

/**
 * Links one of the user's computers to one of their workspaces, so every
 * bot working there can use it. The first one linked becomes the
 * workspace's default. Linking it twice is a no-op.
 */
export default async function addComputerToWorkspace({
    user_id,
    workspace_id,
    computer_id,
}: Params) {
    await assertCrewManager({ user_id });

    const computer = await grabUserComputer({ computer_id, user_id });
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!computer?.id || !workspace?.id) {
        throw new AppError(`Computer or workspace not found.`);
    }

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO workspace_computers (workspace_id, computer_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        values: [workspace.id, computer.id, Date.now(), Date.now()],
    });

    if (!workspace.computer_id) {
        await BunSQLite.sql({
            sql: `UPDATE workspaces SET computer_id = ?, updated_at = ? WHERE id = ?`,
            values: [computer.id, Date.now(), workspace.id],
        });
    }
}
