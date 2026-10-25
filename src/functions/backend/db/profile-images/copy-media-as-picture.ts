import mediaFilePath from "@/src/utils/media-file-path";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { extensionOf } from "@/src/functions/backend/db/bot-files/media-type-for-file";
import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import type { MediaParadigm } from "@/src/types";
import AppError from "@/src/utils/app-error";

export type PictureTarget = "bot" | "workspace";

/**
 * The paradigm a bot's and a workspace's picture is saved under: what
 * `set-profile-image.ts` and `update-workspace.ts` both read and delete by,
 * so a picture is never mistaken for a chat upload or a bot file.
 */
export const PictureParadigms: Record<PictureTarget, MediaParadigm> = {
    bot: "bot-image",
    workspace: "workspace-image",
};

type SaveParams = {
    data: Buffer;
    ext: string;
    paradigms: MediaParadigm[];
    title: string;
    user_id: number;
};

type Params = {
    /**
     * The image to copy: a `media` row the caller already checked the user
     * reaches (`grabPictureSource`).
     */
    media: BUN_SQLITE_COBBLE_MEDIA;
    user_id: number | string;
    target: PictureTarget;
    /**
     * What the new row is called, e.g. "Summit Lending picture".
     */
    title?: string | null;
    /**
     * Writes the copy and answers its new row. Swapped in tests, so the
     * copy is checked without sharp.
     */
    save?: (params: SaveParams) => Promise<BUN_SQLITE_COBBLE_MEDIA | null>;
};

/**
 * Copies an image the user can see into a new picture row: a bot's or a
 * workspace's picture is always its own `media` row, in its own paradigm.
 *
 * A bot is given the files it works with (`[file:ID]`) and the uploads the
 * user sent it, never a raw media id, so a picture is copied from what it
 * already reaches. The source keeps its row and its bytes: the message
 * that attached it still loads, and changing the picture later can never
 * take a file away from a conversation.
 */
export default async function copyMediaAsPicture({
    media,
    user_id,
    target,
    title,
    save = savePictureMedia,
}: Params): Promise<number> {
    const id = Number(media.id);

    if (!id) {
        throw new AppError(`That picture is gone. Pick another one.`);
    }

    if (media.media_type != "image") {
        throw new AppError(
            `A picture has to be an image. This one is a ${media.media_type || "file"}: an SVG or a document is turned into a PNG first, then that PNG is set.`,
        );
    }

    const bytes = await readMediaBytes({ media });

    if (bytes.length > AppData.ProfileImageMaxBytes) {
        throw new AppError(
            `That picture is too big. Pictures can be up to ${Math.round(AppData.ProfileImageMaxBytes / 1024 / 1024)} MB.`,
        );
    }

    const saved = await save({
        data: bytes,
        ext: extensionOf({ name: media.media_write_path, mime_type: media.mime_type }) || "png",
        paradigms: [PictureParadigms[target]],
        title: title?.trim() || `${target} picture`,
        user_id: Number(user_id),
    });

    if (!saved?.id) {
        throw new AppError(`Couldn't save the picture. Try another image.`);
    }

    return Number(saved.id);
}

/**
 * The image's bytes, read from where `media` keeps them.
 */
async function readMediaBytes({ media }: { media: BUN_SQLITE_COBBLE_MEDIA }) {
    const absolute = mediaFilePath({ write_path: media.media_write_path });

    if (!absolute) {
        throw new AppError(`Its file is missing on the server. Save it again.`);
    }

    const file = Bun.file(absolute);

    if (!(await file.exists())) {
        throw new AppError(`Its file is missing on the server. Save it again.`);
    }

    return Buffer.from(await file.arrayBuffer());
}

/**
 * Writes the copy as a picture: a private image, owned by the user whose
 * crew it is, under its own paradigm.
 */
async function savePictureMedia({ data, ext, paradigms, title, user_id }: SaveParams) {
    const res = await uploadAndRecordMedia({
        data,
        media_type: "image",
        media_mime_type: ext,
        media_paradigms: paradigms,
        media: { title },
        user: { id: user_id },
    });

    return res.singleRes || null;
}
