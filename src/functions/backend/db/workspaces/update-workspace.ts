import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_WORKSPACES,
    BunSQLiteTables,
} from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabUserWorkspace from "./grab-user-workspace";
import _ from "lodash";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import copyMediaAsPicture from "@/src/functions/backend/db/profile-images/copy-media-as-picture";
import grabOwnPictureMedia from "@/src/functions/backend/db/profile-images/grab-own-picture-media";
import removeReplacedPicture from "@/src/functions/backend/db/profile-images/remove-replaced-picture";
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
        /**
         * The image to copy for the picture, for a caller that already
         * resolved one (a bot naming one of its files). Copied, so the
         * source's row and bytes stay where they are.
         */
        picture_source?: BUN_SQLITE_COBBLE_MEDIA | null;
    };
};

/**
 * Updates one of the user's workspaces. Its `system_prompt` is shared
 * context for every bot in it, and `image_media_id` its picture: a media
 * id replaces it (the old picture is deleted), null removes it, and
 * `picture_source` copies an image into a new picture row first.
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

    const source = data.picture_source;

    /**
     * A source that is already the picture changes nothing: copying it
     * again would only churn a row and delete the old one for no reason.
     */
    const requested =
        source?.id && Number(source.id) == Number(workspace.image_media_id)
            ? undefined
            : source
              ? await copyMediaAsPicture({
                    media: source,
                    user_id,
                    target: "workspace",
                    title: `${workspace.name || "Workspace"} picture`,
                })
              : data.image_media_id;

    const image_media_id = resolveWorkspacePicture({
        requested,
        current: workspace.image_media_id,
        media:
            requested == null
                ? null
                : source
                  ? { id: requested, media_type: "image" }
                  : await grabOwnPictureMedia({ media_id: requested, user_id }),
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
     * any more. Only a picture is deleted (`removeReplacedPicture`): a row
     * a chat message still attaches stays, so the message keeps loading.
     */
    if (image_media_id !== undefined) {
        await removeReplacedPicture({
            previous: workspace.image_media_id,
            next: image_media_id,
            user_id,
            target: "workspace",
        });
    }
}
