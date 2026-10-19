import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserWorkspace from "./grab-user-workspace";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
};

/**
 * Deletes one of the user's workspaces with its conversations, its
 * links and its models. Its bots and computers stay.
 */
export default async function deleteWorkspace({ user_id, workspace_id }: Params) {
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

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

    return workspace;
}
