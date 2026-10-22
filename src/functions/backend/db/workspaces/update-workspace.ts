import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_WORKSPACES,
    BunSQLiteTables,
} from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabUserWorkspace from "./grab-user-workspace";
import _ from "lodash";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import grabOwnPictureMedia from "@/src/functions/backend/db/profile-images/grab-own-picture-media";
import resolveWorkspacePicture from "@/src/utils/resolve-workspace-picture";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    /**
     * Only the fields given are changed.
     */
    data: Pick<
        BUN_SQLITE_COBBLE_WORKSPACES,
        "name" | "description" | "system_prompt" | "archived"
    > & {
        /**
         * A new picture (a `media` id of the user's own), null to remove
         * it, or undefined to leave it alone.
         */
        image_media_id?: number | null;
    };
};

/**
 * Updates one of the user's workspaces. Its `system_prompt` is shared
 * context for every bot in it, and `image_media_id` its picture: a media
 * id replaces it (the old picture is deleted), null removes it.
 */
export default async function updateWorkspace({
    user_id,
    workspace_id,
    data,
}: Params) {
    await assertCrewManager({ user_id });

    assertPromptLength({ label: "System prompt", text: data.system_prompt });

    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id) {
        throw new AppError(`Workspace not found.`);
    }

    const image_media_id = resolveWorkspacePicture({
        requested: data.image_media_id,
        current: workspace.image_media_id,
        media:
            data.image_media_id == null
                ? null
                : await grabOwnPictureMedia({ media_id: data.image_media_id, user_id }),
    });

    const res = await BunSQLite.update<
        BUN_SQLITE_COBBLE_WORKSPACES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "workspaces",
        targetId: workspace.id,
        /**
         * `BunSQLite.update` writes every key it gets, so a field left out
         * here would be set to null.
         */
        data: _.omitBy(
            {
                name: data.name,
                description: data.description,
                system_prompt: data.system_prompt,
                archived: data.archived,
                image_media_id,
            },
            _.isUndefined,
        ),
    });

    if (!res.success) {
        throw new Error(`Couldn't update the workspace: ${res.msg}`);
    }

    /**
     * The picture is written, so the one it replaced isn't shown anywhere
     * any more.
     */
    if (
        image_media_id !== undefined &&
        workspace.image_media_id &&
        Number(workspace.image_media_id) != Number(image_media_id)
    ) {
        await deleteMedia({
            id: workspace.image_media_id,
            user_id: Number(user_id),
        }).catch(() => {});
    }
}
