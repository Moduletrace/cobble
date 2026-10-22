import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA, BunSQLiteTables } from "@/db/types/db";
import grabDirNames from "@/src/utils/grab-dir-names";
import { existsSync } from "node:fs";
import path from "node:path";
import userAuth from "../../backend/auth/user-auth";
import grabSharedPictureMedia from "@/src/functions/backend/db/access/grab-shared-picture-media";
import grabBotFileMedia from "@/src/functions/backend/db/bot-files/grab-bot-file-media";
import grabTaskMediaFile from "@/src/functions/backend/db/tasks/grab-task-media-file";

const { DATA_DIR } = grabDirNames();

type Params = {
    req: Request;
};

export default async function handleMediaServer({
    req,
}: Params): Promise<Response> {
    const url = new URL(req.url);

    const [root, privacy, media_id, thumbnail] = url.pathname
        .split("/")
        .filter((p) => p.match(/./));

    if (!privacy) {
        throw new Error(`No media privacy params passed`);
    }

    let media: BUN_SQLITE_COBBLE_MEDIA | undefined = undefined;

    if (privacy == "private") {
        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status) {
            throw new Error(`Not logged in`);
        }

        const media_res = await BunSQLite.select<
            BUN_SQLITE_COBBLE_MEDIA,
            (typeof BunSQLiteTables)[number]
        >({
            table: "media",
            query: {
                query: {
                    user_id: {
                        value: user.id,
                    },
                },
            },
            targetId: media_id,
        });

        media =
            media_res.singleRes ||
            (media_id ? await grabSharedPictureMedia({ media_id, user_id: user.id! }) : null) ||
            (media_id ? await grabBotFileMedia({ media_id, user_id: user.id! }) : null) ||
            (media_id ? await grabTaskMediaFile({ media_id, user_id: user.id! }) : null) ||
            undefined;
    } else {
        const media_res = await BunSQLite.select<
            BUN_SQLITE_COBBLE_MEDIA,
            (typeof BunSQLiteTables)[number]
        >({
            table: "media",
            targetId: media_id,
        });

        media = media_res.singleRes || undefined;

        /**
         * A private file is only served through `/media/private`, to its
         * owner (or, for a bot's or workspace's picture, to whoever sees
         * it).
         */
        if (media?.is_private) {
            media = undefined;
        }
    }

    if (!media?.id) {
        throw new Error(`Media record not found!`);
    }

    const media_location = thumbnail
        ? media.media_thumbnail_write_path
        : media.media_write_path;

    if (!media_location) {
        throw new Error(`No media location found!`);
    }

    const full_media_location = path.join(DATA_DIR, media_location);

    if (!existsSync(full_media_location)) {
        throw new Error(`Media does not exist!`);
    }

    const file = Bun.file(full_media_location);
    const etag = `"${file.size}-${file.lastModified}"`;
    const cache_control =
        privacy == "private" ? "private, no-cache" : "public, no-cache";

    const headers = new Headers({
        ETag: etag,
        "Cache-Control": cache_control,
    });

    if (req.headers.get("if-none-match") === etag) {
        return new Response(null, {
            status: 304,
            headers,
        });
    }

    return new Response(file, { headers });
}
