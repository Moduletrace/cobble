import { AppData } from "@/src/data/app-data";
import grabPictureSource from "@/src/functions/backend/db/profile-images/grab-picture-source";
import AppError from "@/src/utils/app-error";
import mediaFilePath from "@/src/utils/media-file-path";
import type { StorageScope } from "@/src/utils/storage-access";

/**
 * Image types every image model takes as a reference.
 */
const ReferenceImageTypes = ["png", "jpeg", "jpg", "webp", "gif"];

type Params = {
    user_id: number | string;
    /**
     * The files the run reaches, so a reference is only ever a file the
     * bot could already read.
     */
    scopes: StorageScope[];
    /**
     * Files by `[file:ID]` id.
     */
    file_ids?: number[];
    /**
     * The user's own uploads, by media id.
     */
    media_ids?: number[];
};

/**
 * The reference images an image call passes on, as `data:` URLs. Each is
 * checked the way a picture is (`grabPictureSource`: a file in the run's
 * directories or the user's own upload), then to be a raster image within
 * `AppData.ImageReferenceMaxBytes`. Throws on the first one that isn't.
 */
export default async function loadReferenceImages({
    user_id,
    scopes,
    file_ids = [],
    media_ids = [],
}: Params): Promise<string[]> {
    const sources: { file_id?: number; media_id?: number }[] = [
        ...file_ids.map((file_id) => ({ file_id })),
        ...media_ids.map((media_id) => ({ media_id })),
    ];

    if (sources.length > AppData.ImageReferenceMaxCount) {
        throw new AppError(`Pass at most ${AppData.ImageReferenceMaxCount} reference images.`);
    }

    const urls: string[] = [];

    for (const source of sources) {
        const media = await grabPictureSource({ user_id, scopes, ...source });
        const label = source.file_id ? `[file:${source.file_id}]` : `media id ${source.media_id}`;
        const type = (media?.mime_type || "").replace(/^image\//, "").toLowerCase();

        if (!media || media.media_type != "image" || !ReferenceImageTypes.includes(type)) {
            throw new AppError(
                `${label} can't be a reference: use a PNG, JPEG, WebP or GIF image.`,
            );
        }

        const absolute = mediaFilePath({ write_path: media.media_write_path });
        const disk = absolute ? Bun.file(absolute) : null;

        if (!disk || !(await disk.exists())) {
            throw new AppError(`${label} is missing on the server.`);
        }

        if (disk.size > AppData.ImageReferenceMaxBytes) {
            throw new AppError(
                `${label} is too large to pass on (at most ${Math.round(AppData.ImageReferenceMaxBytes / (1024 * 1024))} MB).`,
            );
        }

        const base64 = Buffer.from(await disk.arrayBuffer()).toString("base64");

        urls.push(`data:image/${type == "jpg" ? "jpeg" : type};base64,${base64}`);
    }

    return urls;
}
