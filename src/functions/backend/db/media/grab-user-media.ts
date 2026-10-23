import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA, BunSQLiteTables } from "@/db/types/db";
import grabSharedPictureMedia from "@/src/functions/backend/db/access/grab-shared-picture-media";
import grabBotFileMedia from "@/src/functions/backend/db/bot-files/grab-bot-file-media";
import grabTaskMediaFile from "@/src/functions/backend/db/tasks/grab-task-media-file";

type Params = {
    media_id: number | string;
    user_id: number | string;
};

/**
 * One media row, only if this user may load its bytes. Every media URL is
 * `/media/<id>` and every one of them is private, so this is the single
 * gate in front of the file on disk:
 *
 * - the user's own uploads (`media.user_id`),
 * - a picture every signed-in user may see: a member's current profile
 *   photo, a bot's picture, a workspace's picture (`grabSharedPictureMedia`),
 * - a bot's or workspace's file, to whoever reaches the folder it lives in
 *   (`grabBotFileMedia`),
 * - a file attached to a task, to whoever reaches the task
 *   (`grabTaskMediaFile`).
 *
 * Null when it is not theirs to see, so a request never turns into a path
 * before this has passed.
 */
export default async function grabUserMedia({
    media_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_MEDIA | undefined> {
    if (!media_id || !user_id) return undefined;

    const own = await BunSQLite.select<
        BUN_SQLITE_COBBLE_MEDIA,
        (typeof BunSQLiteTables)[number]
    >({
        table: "media",
        query: {
            query: {
                user_id: {
                    value: user_id,
                },
            },
        },
        targetId: media_id,
    });

    return (
        own.singleRes ||
        (await grabSharedPictureMedia({ media_id })) ||
        (await grabBotFileMedia({ media_id, user_id })) ||
        (await grabTaskMediaFile({ media_id, user_id })) ||
        undefined
    );
}
