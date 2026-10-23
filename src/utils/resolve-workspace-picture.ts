import AppError from "@/src/utils/app-error";

type Params = {
    /**
     * The `workspace_media_id` the caller asked for: a new picture, or
     * null to remove the one it has. Undefined leaves it alone.
     */
    requested?: number | string | null;
    /**
     * The picture the workspace has now.
     */
    current?: number | string | null;
    /**
     * The media row the requested id names, when it was found for the
     * caller (`grabOwnPictureMedia`); required to set a new picture.
     */
    media?: { id?: number | string | null; media_type?: string | null } | null;
};

/**
 * What `updateWorkspace` should write into `workspaces.image_media_id`:
 * undefined to leave it as it is, null to clear it, or the new media id.
 *
 * A new picture has to be the caller's own image: the resolver refuses an
 * id that isn't an image, and the media lookup refuses one that isn't
 * theirs. Handing back the picture it already has changes nothing, so
 * saying "use this picture" twice never deletes it.
 */
export default function resolveWorkspacePicture({ requested, current, media }: Params) {
    if (requested === undefined) return undefined;

    if (requested === null) return null;

    const id = Number(requested);

    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(`Pick an image for the workspace.`);
    }

    if (current != null && Number(current) == id) return undefined;

    if (!media || Number(media.id) != id) {
        throw new AppError(
            `That picture isn't one you can use. Name a PNG, JPG, WebP or GIF in your files by its [file:ID] ref, or upload it in chat.`,
        );
    }

    if (media.media_type != "image") {
        throw new AppError(
            `A workspace picture has to be an image. This one is a ${media.media_type || "file"}: an SVG or a document is turned into a PNG first, then that PNG is set.`,
        );
    }

    return id;
}
