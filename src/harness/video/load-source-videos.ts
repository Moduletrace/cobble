import { AppData } from "@/src/data/app-data";
import grabPictureSource from "@/src/functions/backend/db/profile-images/grab-picture-source";
import AppError from "@/src/utils/app-error";
import mediaFilePath from "@/src/utils/media-file-path";
import type { StorageScope } from "@/src/utils/storage-access";

/**
 * Video types the video models take to change.
 */
const SourceVideoTypes: Record<string, string> = {
    mp4: "video/mp4",
    webm: "video/webm",
    quicktime: "video/quicktime",
    mov: "video/quicktime",
};

type Params = {
    user_id: number | string;
    /**
     * The files the run reaches, so a video is only ever a file the bot
     * could already read.
     */
    scopes: StorageScope[];
    /**
     * Each video by `[file:ID]` id or, for the user's own uploads, media
     * id.
     */
    sources: { file_id?: number; media_id?: number }[];
};

/**
 * The videos a video call changes, as `data:` URLs. Each is checked the
 * way a picture's source is (`grabPictureSource`: a file in the run's
 * directories or the user's own upload), then to be an MP4, WebM or
 * QuickTime video within `AppData.VideoSourceMaxBytes`. Throws on the
 * first one that isn't.
 */
export default async function loadSourceVideos({ user_id, scopes, sources }: Params): Promise<string[]> {
    if (sources.length > AppData.VideoSourceMaxCount) {
        throw new AppError(`Pass at most ${AppData.VideoSourceMaxCount} videos.`);
    }

    const urls: string[] = [];

    for (const source of sources) {
        const media = await grabPictureSource({ user_id, scopes, ...source });
        const label = source.file_id ? `[file:${source.file_id}]` : `media id ${source.media_id}`;
        const type = SourceVideoTypes[(media?.mime_type || "").replace(/^video\//, "").toLowerCase()];

        if (!media || media.media_type != "video" || !type) {
            throw new AppError(`${label} can't be changed: use an MP4, WebM or QuickTime video.`);
        }

        const absolute = mediaFilePath({ write_path: media.media_write_path });
        const disk = absolute ? Bun.file(absolute) : null;

        if (!disk || !(await disk.exists())) {
            throw new AppError(`${label} is missing on the server.`);
        }

        if (disk.size > AppData.VideoSourceMaxBytes) {
            throw new AppError(
                `${label} is too large to pass on (at most ${Math.round(AppData.VideoSourceMaxBytes / (1024 * 1024))} MB). Trim or shrink it on a computer first.`,
            );
        }

        urls.push(`data:${type};base64,${Buffer.from(await disk.arrayBuffer()).toString("base64")}`);
    }

    return urls;
}
