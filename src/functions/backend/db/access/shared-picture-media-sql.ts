import type { SqlCondition } from "@/src/utils/crew-access/types";

type Params = {
    /**
     * The `media` table alias the condition reads.
     */
    alias?: string;
};

/**
 * The pictures every signed-in user may load, whoever they are and whatever
 * crew they reach:
 *
 * - a member's current profile photo (their primary `user-profile-image`,
 *   the one `grabUsers` reports as `profile_media_id`),
 * - a bot's picture (whatever `bots.image_media_id` points at),
 * - a workspace's picture (whatever `workspaces.image_media_id` points at).
 *
 * Bots and workspaces belong to the install, and people know each other by
 * their photo, so a picture is never limited to whoever happens to reach
 * its owner. It does have to be one still in use: a profile photo's
 * paradigm alone is not enough, since a removed photo leaves its paradigm
 * row behind. A bot's or workspace's picture is shared because the bot or
 * workspace points at it, not by its paradigm: a picture set before
 * pictures were copied into their own `bot-image`/`workspace-image` row is
 * the chat upload itself, and it is still the face everyone sees.
 */
export default function sharedPictureMediaSql({ alias = "m" }: Params = {}): SqlCondition {
    return {
        sql: `(
            EXISTS (
                SELECT 1 FROM media_paradigms mp
                WHERE mp.media_id = ${alias}.id
                  AND mp.media_paradigm = 'user-profile-image'
                  AND ${alias}.is_primary = 1
            )
            OR EXISTS (SELECT 1 FROM bots b WHERE b.image_media_id = ${alias}.id)
            OR EXISTS (SELECT 1 FROM workspaces w WHERE w.image_media_id = ${alias}.id)
        )`,
        values: [],
    };
}
