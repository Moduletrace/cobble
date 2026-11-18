import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabUserWorkspace from "./grab-user-workspace";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import applyHostDirectoryGrant from "../host-directories/apply-host-directory-grant";
import grabWorkspaceHostDirectoryIds from "../host-directories/grab-workspace-host-directory-ids";
import reconcileComputerHostDirectories from "../host-directories/reconcile-computer-host-directories";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    bot_id: number | string;
};

/**
 * Assigns one of the user's bots to one of their workspaces. Assigning a
 * bot that is already there is a no-op. Through the workspace it reaches
 * its computers, so a host directory linked to one of them has to be
 * mounted in its own folder (`reconcileComputerHostDirectories`).
 */
export default async function addBotToWorkspace({
    user_id,
    workspace_id,
    bot_id,
}: Params) {
    await assertCrewManager({ user_id });

    const bot = await grabUserBot({ bot_id, user_id });
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!bot?.id || !workspace?.id) {
        throw new AppError(`Bot or workspace not found.`);
    }

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO workspace_bots (workspace_id, bot_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        values: [workspace.id, bot.id, Date.now(), Date.now()],
    });

    await reconcileComputerHostDirectories({ workspace_id: Number(workspace.id) });

    /**
     * The folders mounted in this workspace now reach it, so each gives it
     * access, as every bot working there has it.
     */
    for (const host_directory_id of await grabWorkspaceHostDirectoryIds({
        workspace_id: Number(workspace.id),
    })) {
        await applyHostDirectoryGrant({
            host_directory_id,
            retry: false,
        }).catch(() => {});
    }
}
