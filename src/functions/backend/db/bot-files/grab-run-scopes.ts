import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabStorageScopes, { type StorageScope } from "@/src/utils/storage-access";

type Params = {
    bot: Pick<BUN_SQLITE_COBBLE_BOTS, "id" | "kind">;
    /**
     * The user the run is for: the coordinator reaches their workspaces.
     */
    user_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * The directories one run may touch, and the only place the coordinator's
 * workspaces are read for it: its own folder first, then every workspace's
 * (`grabStorageScopes`).
 *
 * Every tool that takes files uses this, so a file a bot can read with
 * `list_files` is exactly a file it can set as a picture, attach to a task
 * or import into.
 */
export default async function grabRunScopes({ bot, user_id, workspace_id }: Params): Promise<StorageScope[]> {
    const all_workspace_ids =
        bot.kind == "coordinator"
            ? (await grabUserWorkspaces({ user_id }))
                  .filter((workspace) => !workspace.archived)
                  .map((workspace) => Number(workspace.id))
            : [];

    return grabStorageScopes({
        bot_id: bot.id || 0,
        bot_kind: bot.kind,
        workspace_id,
        all_workspace_ids,
    });
}
