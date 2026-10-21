import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES, BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import type { BotMessageAttachment, MediaType } from "@/src/types";

type Params = {
    media: BUN_SQLITE_COBBLE_MEDIA;
    /**
     * The bot file it is, when the caller already knows (avoids a lookup
     * per attachment).
     */
    file_id?: number | null;
};

/**
 * A `media` row as a chat attachment: its original name (`title`), type
 * and the private URLs it's served at. A file saved in a bot's folder
 * carries its `file_id`, so the chip can open the file's page.
 */
export default function mediaToAttachment({ media, file_id }: Params): BotMessageAttachment {
    const { media_url, media_thumbnail_url } = grabMediaURL({ media: { ...media } });

    return {
        id: Number(media.id),
        name: media.title || `File ${media.id}`,
        media_type: (media.media_type || "document") as MediaType,
        url: media_url || "",
        thumbnail_url: media_thumbnail_url,
        file_id: file_id || undefined,
    };
}

/**
 * The `bot_files` rows behind a message's media, keyed by media id, so the
 * attachments can carry their file ids without a query each.
 */
export async function grabAttachmentFileIds({ media_ids }: { media_ids: number[] }) {
    const ids = media_ids.filter((id) => id > 0);

    if (!ids.length) return new Map<number, number>();

    const placeholders = ids.map(() => "?").join(", ");

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT id, media_id FROM bot_files WHERE media_id IN (${placeholders})`,
        values: ids,
    });

    return new Map(
        (res.payload || [])
            .filter((file) => file.media_id)
            .map((file) => [Number(file.media_id), Number(file.id)]),
    );
}
