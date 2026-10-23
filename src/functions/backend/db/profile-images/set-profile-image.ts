import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import type { ProfileImageTarget } from "@/src/schemas/profile-image-schema";
import AppError from "@/src/utils/app-error";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import { PictureParadigms } from "./copy-media-as-picture";
import removeReplacedPicture from "./remove-replaced-picture";

type Params = {
    user_id: number | string;
    target: ProfileImageTarget;
    id: number | string;
    /**
     * The new picture as a base64 data URL; null removes it.
     */
    data_url: string | null;
};

const Tables: Record<ProfileImageTarget, string> = {
    bot: "bots",
    workspace: "workspaces",
};

/**
 * Sets (or removes) the picture of one of the user's bots or workspaces:
 * a private image, the old picture deleted. Returns the new
 * `image_media_id`.
 *
 * The picture picked here is copied into its own row
 * (`PictureParadigms`), and only a picture is deleted when it is replaced
 * (`removeReplacedPicture`), never a row a chat message still attaches.
 */
export default async function setProfileImage({ user_id, target, id, data_url }: Params) {
    await assertCrewManager({ user_id });

    const record =
        target == "bot"
            ? await grabUserBot({ bot_id: id, user_id })
            : await grabUserWorkspace({ workspace_id: id, user_id });

    if (!record?.id) {
        throw new AppError(target == "bot" ? `Bot not found.` : `Workspace not found.`);
    }

    const table = Tables[target];
    let image_media_id: number | null = null;

    if (data_url) {
        if (!/^data:image\/(png|jpe?g|webp|gif)/i.test(data_url)) {
            throw new AppError(`Pick a PNG, JPG, WebP or GIF image.`);
        }

        const { buffer, ext } = await bufferFromBase64(data_url);

        if (buffer.length > AppData.ProfileImageMaxBytes) {
            throw new AppError(
                `That picture is too big. Pictures can be up to ${Math.round(AppData.ProfileImageMaxBytes / 1024 / 1024)} MB.`,
            );
        }

        const res = await uploadAndRecordMedia({
            data: buffer,
            media_type: "image",
            /**
             * The image's own format: a transparent PNG stays a PNG
             * (`imageOutputFormat`).
             */
            media_mime_type: ext,
            media_paradigms: [PictureParadigms[target]],
            media: { title: `${record.name || target} picture` },
            user: { id: Number(user_id) },
        });

        if (!res.singleRes?.id) {
            throw new AppError(`Couldn't save the picture. Try another image.`);
        }

        image_media_id = Number(res.singleRes.id);
    }

    await BunSQLite.sql({
        sql: `UPDATE ${table} SET image_media_id = ?, updated_at = ? WHERE id = ?`,
        values: [image_media_id, Date.now(), record.id],
    });

    await removeReplacedPicture({
        previous: record.image_media_id,
        next: image_media_id,
        user_id,
        target,
    });

    return { image_media_id };
}
