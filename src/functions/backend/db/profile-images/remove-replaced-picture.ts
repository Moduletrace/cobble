import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import isPictureMedia from "./is-picture-media";

type Params = {
    /**
     * The picture that was shown before (`bots.image_media_id` or
     * `workspaces.image_media_id`).
     */
    previous?: number | string | null;
    /**
     * The one written now; the same id means nothing changed.
     */
    next?: number | string | null;
    /**
     * Whose row it is: a picture is the user's, so deleting it is theirs.
     */
    user_id: number | string;
    target?: "bot" | "workspace";
    /**
     * Swapped in tests, so the decision is checked without a database.
     */
    isPicture?: typeof isPictureMedia;
    remove?: typeof deleteMedia;
};

/**
 * Deletes the picture a bot or a workspace no longer shows, so its bytes
 * don't stay on disk for nothing.
 *
 * Only a picture is deleted (`isPictureMedia`): a row a chat message still
 * attaches is left where it is, because removing it would break a message
 * the user can still scroll to.
 */
export default async function removeReplacedPicture({
    previous,
    next,
    user_id,
    target = "bot",
    isPicture = isPictureMedia,
    remove = deleteMedia,
}: Params) {
    if (!previous) return;
    if (next != null && Number(previous) == Number(next)) return;

    if (!(await isPicture({ media_id: previous, target }))) return;

    await remove({ id: previous, user_id: Number(user_id) }).catch(() => {});
}
