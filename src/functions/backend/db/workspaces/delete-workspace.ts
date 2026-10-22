import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import purgeStorage, { grabStorageMediaIds } from "@/src/functions/backend/db/bot-files/purge-storage";
import { grabTaskMediaIds } from "@/src/functions/backend/db/tasks/purge-task-media";
import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserWorkspace from "./grab-user-workspace";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
};

/**
 * Deletes one of the user's workspaces with its conversations, its
 * links and its models. Its bots and computers stay.
 */
export default async function deleteWorkspace({ user_id, workspace_id }: Params) {
    await assertCrewManager({ user_id });

    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

    /**
     * Read before the delete: the shared files' rows go with the workspace.
     */
    const file_media_ids = await grabStorageMediaIds({
        scope: "workspace",
        owner_id: workspace.id!,
    }).catch(() => []);
    /**
     * And what its tasks filed outside a folder.
     */
    const task_media_ids = await grabTaskMediaIds({ workspace_id: workspace.id! }).catch(() => []);

    const res = await BunSQLite.sql({
        sql: `DELETE FROM workspaces WHERE id = ?`,
        values: [workspace.id],
    });

    if (!res.success) {
        throw new Error(`Couldn't delete the workspace: ${res.error}`);
    }

    if (workspace.image_media_id) {
        await deleteMedia({ id: workspace.image_media_id, user_id: Number(user_id) }).catch(() => {});
    }

    /**
     * What the workspace's tasks filed and no folder owns (a chat upload).
     */
    await deleteMedia({ ids: task_media_ids, user_id: Number(user_id), can_delete_all_media: true }).catch(
        () => {},
    );

    /**
     * The bots' shared folder there goes with it.
     */
    await purgeStorage({
        scope: "workspace",
        owner_id: workspace.id!,
        media_ids: file_media_ids,
    });

    return workspace;
}
