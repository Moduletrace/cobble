import type { PublicBotFile } from "@/src/types";
import botFileFullPath from "@/src/utils/bot-file-full-path";
import grabMediaURL from "../../media/grab-media-url";

export type BotFileWithMediaLite = {
    id?: number | "";
    media_id?: number | "";
    name?: string;
    path?: string;
    size?: number | "";
    media_type?: string;
    purpose?: string;
    scope?: string;
    owner_id?: number | "";
    created_at?: number | "";
    media?: Record<string, unknown> | null;
};

/**
 * A bot file as the chat shows it (its chips, its previews, its files
 * modal): the page props and the files API both read through this, so a
 * field added for one reaches the other.
 */
export default function botFileToPublic({ file }: { file: BotFileWithMediaLite }): PublicBotFile {
    /**
     * The file's own type stands in when its media row wasn't joined (the
     * folder listing reads `bot_files` alone), so an image still gets its
     * thumbnail.
     */
    const { media_url, media_thumbnail_url } = grabMediaURL({
        media: { media_type: file.media_type, ...(file.media || {}), id: file.media_id } as any,
    });

    return {
        id: Number(file.id),
        name: file.name || "",
        path: file.path || "",
        size: Number(file.size) || 0,
        media_type: file.media_type || "document",
        purpose: file.purpose || "writing",
        scope: file.scope || "bot",
        owner_id: Number(file.owner_id) || 0,
        created_at: Number(file.created_at) || 0,
        url: media_url || "",
        thumbnail_url: media_thumbnail_url,
        full_path: botFileFullPath({ scope: file.scope, owner_id: file.owner_id, path: file.path }),
    };
}
