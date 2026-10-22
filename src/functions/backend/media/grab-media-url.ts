import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";

type Params = {
    media?: BUN_SQLITE_COBBLE_MEDIA;
    user?: BUN_SQLITE_COBBLE_USERS_JOIN;
};

/**
 * Where a media file is served: `/media/<id>`, always, with
 * `/media/<id>/thumbnail` for an image's smaller copy.
 *
 * There is no public media and no `public`/`private` segment to pick: every
 * media URL is private, so the request is checked against the signed-in
 * user when it arrives (`grabUserMedia`).
 */
export default function grabMediaURL({ media: passed_media, user }: Params) {
    const media = passed_media || {};

    if (user?.profile_media_id) {
        media.id = user.profile_media_id;
    }

    if (!media.id) {
        return {};
    }

    const media_url = `/media/${media.id}`;

    const media_thumbnail_url =
        media.media_type == "image" || user?.id
            ? `${media_url}/thumbnail`
            : undefined;

    return { media_url, media_thumbnail_url };
}
