import mediaFilePath from "@/src/utils/media-file-path";
import servedFileHeaders from "@/src/utils/served-file-headers";
import { existsSync } from "node:fs";
import userAuth from "../../backend/auth/user-auth";
import grabUserMedia from "../../backend/db/media/grab-user-media";


type Params = {
    req: Request;
};

/**
 * Serves a media file's bytes: `/media/<id>`, and `/media/<id>/thumbnail`
 * for an image's smaller copy.
 *
 * There is no public media. Every URL is private, so the request has to be
 * signed in and the user has to reach the file (`grabUserMedia` decides
 * that: their own upload, any profile photo, bot picture or workspace
 * picture, a bot's or workspace's file they can reach, a file on one of
 * their tasks). Anything else is answered with a 404, never with the file.
 */
export default async function handleMediaServer({
    req,
}: Params): Promise<Response> {
    const url = new URL(req.url);

    const [_root, media_id, thumbnail] = url.pathname
        .split("/")
        .filter((p) => p.match(/./));

    if (!media_id) {
        throw new Error(`No media id passed`);
    }

    const { user } = await userAuth({ req });

    if (!user?.logged_in_status) {
        throw new Error(`Not logged in`);
    }

    const media = await grabUserMedia({ media_id, user_id: user.id! });

    if (!media?.id) {
        throw new Error(`Media record not found!`);
    }

    const full_media_location = mediaFilePath({
        write_path: thumbnail
            ? media.media_thumbnail_write_path
            : media.media_write_path,
    });

    if (!full_media_location) {
        throw new Error(`No media location found!`);
    }

    if (!existsSync(full_media_location)) {
        throw new Error(`Media does not exist!`);
    }

    const file = Bun.file(full_media_location);
    const etag = `"${file.size}-${file.lastModified}"`;

    const headers = new Headers({
        ...servedFileHeaders({ content_type: file.type }),
        ETag: etag,
        /**
         * Private: the response depends on who is signed in, so no shared
         * cache may hold it.
         */
        "Cache-Control": "private, no-cache",
    });

    if (req.headers.get("if-none-match") === etag) {
        return new Response(null, {
            status: 304,
            headers,
        });
    }

    return new Response(file, { headers });
}
