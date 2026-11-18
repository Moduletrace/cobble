import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES, BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import mediaFilePath from "@/src/utils/media-file-path";
import grabBotFileMedia from "./grab-bot-file-media";

type Params = {
    file_id: number | string;
    user_id: number | string;
};

export type BotFileBytes = {
    file: BUN_SQLITE_COBBLE_BOT_FILES;
    media: BUN_SQLITE_COBBLE_MEDIA;
    data: Buffer;
};

/**
 * A bot file's bytes for a user who reaches the directory it's in: the
 * super admin reaches every bot's, so the coordinator can put any bot's
 * file into a knowledgebase, never a file it couldn't be shown itself.
 * Null when there's no such file or its bytes are gone.
 */
export default async function grabBotFileBytesForUser({ file_id, user_id }: Params): Promise<BotFileBytes | null> {
    const file = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
            sql: `SELECT * FROM bot_files WHERE id = ? LIMIT 1`,
            values: [file_id],
        })
    ).payload?.[0];

    if (!file?.id || !file.media_id) return null;

    const media = await grabBotFileMedia({ media_id: file.media_id, user_id });

    if (!media) return null;

    const absolute = mediaFilePath({ write_path: media.media_write_path });
    const data = absolute
        ? await Bun.file(absolute)
              .arrayBuffer()
              .then((buffer) => Buffer.from(buffer))
              .catch(() => null)
        : null;

    if (!data) return null;

    return { file, media, data };
}