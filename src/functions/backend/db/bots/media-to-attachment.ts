import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import type { BotMessageAttachment, MediaType } from "@/src/types";

type Params = {
    media: BUN_SQLITE_COBBLE_MEDIA;
};

/**
 * A `media` row as a chat attachment: its original name (`title`), type
 * and the private URLs it's served at.
 */
export default function mediaToAttachment({ media }: Params): BotMessageAttachment {
    const { media_url, media_thumbnail_url } = grabMediaURL({ media: { ...media } });

    return {
        id: Number(media.id),
        name: media.title || `File ${media.id}`,
        media_type: (media.media_type || "document") as MediaType,
        url: media_url || "",
        thumbnail_url: media_thumbnail_url,
    };
}
