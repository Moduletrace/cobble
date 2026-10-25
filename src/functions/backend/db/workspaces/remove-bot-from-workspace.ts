import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserWorkspace from "./grab-user-workspace";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    bot_id: number | string;
};

/**
 * Removes a bot from one of the user's workspaces.
 */
export default async function removeBotFromWorkspace({
    user_id,
    workspace_id,
    bot_id,
}: Params) {
    await assertCrewManager({ user_id });

    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

    await BunSQLite.sql({
        sql: `DELETE FROM workspace_bots WHERE workspace_id = ? AND bot_id = ?`,
        values: [workspace.id, bot_id],
    });

    /**
     * Its types there (workspace admin) go with its place.
     */
    await BunSQLite.sql({
        sql: `DELETE FROM bot_types WHERE workspace_id = ? AND bot_id = ?`,
        values: [workspace.id, bot_id],
    });
}
