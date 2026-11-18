import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import mediaFilePath from "@/src/utils/media-file-path";

type Params = {
    media_id: number | string;
    user_id: number | string;
};

export type UserUploadBytes = {
    media: BUN_SQLITE_COBBLE_MEDIA;
    data: Buffer;
};

/**
 * One of a user's own uploads (a file they attached in a chat), by media
 * id: nobody else's, so the coordinator only takes back what the super
 * admin handed it. Null when it isn't theirs or its bytes are gone.
 */
export default async function grabUserUploadBytes({ media_id, user_id }: Params): Promise<UserUploadBytes | null> {
    const media = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
            sql: `SELECT * FROM media WHERE id = ? AND user_id = ? LIMIT 1`,
            values: [media_id, Number(user_id)],
        })
    ).payload?.[0];

    if (!media?.id) return null;

    const absolute = mediaFilePath({ write_path: media.media_write_path });
    const data = absolute
        ? await Bun.file(absolute)
              .arrayBuffer()
              .then((buffer) => Buffer.from(buffer))
              .catch(() => null)
        : null;

    if (!data) return null;

    return { media, data };
}