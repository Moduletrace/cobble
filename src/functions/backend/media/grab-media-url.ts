import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";

type Params = {
    media?: BUN_SQLITE_COBBLE_MEDIA;
    user?: BUN_SQLITE_COBBLE_USERS_JOIN;
};

export default function grabMediaURL({ media: passed_media, user }: Params) {
    const media = passed_media || {};

    if (user?.profile_media_id) {
        media.id = user.profile_media_id;
    }

    let media_url = `/media`;

    if (media.is_private) {
        media_url += `/private`;
    } else {
        media_url += `/public`;
    }

    if (!media.id) {
        return {};
    }

    media_url += `/${media.id}`;

    const media_thumbnail_url =
        media.media_type == "image" || user?.id
            ? `${media_url}/thumbnail`
            : undefined;

    return { media_url, media_thumbnail_url };
}
