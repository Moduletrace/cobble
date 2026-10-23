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
 * - a bot's picture (`bots.image_media_id`),
 * - a workspace's picture (`workspaces.image_media_id`).
 *
 * Bots and workspaces belong to the install, and people know each other by
 * their photo, so a picture is never limited to whoever happens to reach
 * its owner. It does have to be one still in use: the paradigm alone is not
 * enough, since a removed picture leaves its paradigm row behind.
 */
export default function sharedPictureMediaSql({ alias = "m" }: Params = {}): SqlCondition {
    return {
        sql: `EXISTS (
            SELECT 1 FROM media_paradigms mp
            WHERE mp.media_id = ${alias}.id
              AND (
                (mp.media_paradigm = 'user-profile-image' AND ${alias}.is_primary = 1)
                OR (mp.media_paradigm = 'bot-image' AND EXISTS (
                    SELECT 1 FROM bots b WHERE b.image_media_id = ${alias}.id
                ))
                OR (mp.media_paradigm = 'workspace-image' AND EXISTS (
                    SELECT 1 FROM workspaces w WHERE w.image_media_id = ${alias}.id
                ))
              )
        )`,
        values: [],
    };
}
