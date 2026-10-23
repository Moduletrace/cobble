import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import type { StorageScope } from "@/src/utils/storage-access";
import AppError from "@/src/utils/app-error";
import grabOwnPictureMedia from "./grab-own-picture-media";

type Params = {
    user_id: number | string;
    /**
     * The directories the run may read (`grabStorageScopes`), so a file id
     * outside them is refused here rather than by the caller.
     */
    scopes?: StorageScope[];
    /**
     * A file the run can see: its `[file:ID]` ref, which is what every file
     * tool answers with.
     */
    file_id?: number | null;
    /**
     * An upload of the user's own, by media id.
     */
    media_id?: number | null;
};

/**
 * The image a picture is copied from, checked to be one the user may use:
 * a file in one of the run's directories (`grabBotFile` decides that, the
 * same gate every other file tool uses) or their own upload
 * (`grabOwnPictureMedia`).
 *
 * Exactly one of `file_id` and `media_id` is needed. Null when neither is
 * given; an id that isn't reachable throws, so a tool never quietly sets
 * someone else's file as a picture.
 */
export default async function grabPictureSource({
    user_id,
    scopes = [],
    file_id,
    media_id,
}: Params): Promise<BUN_SQLITE_COBBLE_MEDIA | null> {
    if (file_id) {
        const file = await grabBotFile({ scopes, file_id });

        if (!file?.media?.id) {
            throw new AppError(
                `No file with that id is in your files. Use list_files to see what you have.`,
            );
        }

        return file.media;
    }

    if (media_id) {
        const media = await grabOwnPictureMedia({ media_id, user_id });

        if (!media?.id) {
            throw new AppError(`That picture isn't one of yours. Upload it again.`);
        }

        return media;
    }

    return null;
}
