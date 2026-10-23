import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import AppError from "@/src/utils/app-error";
import copyMediaAsPicture from "./copy-media-as-picture";
import removeReplacedPicture from "./remove-replaced-picture";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The image to copy for it, or null to remove the picture it has.
     */
    media?: BUN_SQLITE_COBBLE_MEDIA | null;
};

/**
 * Sets (or clears) a bot's picture from an image the caller already checked
 * it reaches (`grabPictureSource` hands `copyMediaAsPicture` the row).
 *
 * Only a super admin or an admin does it, the same rule as the rest of the
 * crew: a bot can dress itself, but only for a user who manages the crew.
 * The coordinator is allowed a picture, and keeps its name and hue-less
 * stone.
 *
 * Returns the new `image_media_id` (null once removed). `updated_at` moves
 * with it, so the live relay pushes the new picture to open tabs.
 */
export default async function setBotPicture({ user_id, bot_id, media }: Params) {
    await assertCrewManager({ user_id });

    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    const image_media_id = media?.id
        ? await copyMediaAsPicture({
              media,
              user_id,
              target: "bot",
              title: `${bot.name || "Bot"} picture`,
          })
        : null;

    await BunSQLite.sql({
        sql: `UPDATE bots SET image_media_id = ?, updated_at = ? WHERE id = ?`,
        values: [image_media_id, Date.now(), bot.id],
    });

    await removeReplacedPicture({
        previous: bot.image_media_id,
        next: image_media_id,
        user_id,
        target: "bot",
    });

    return { image_media_id, bot: bot as BUN_SQLITE_COBBLE_BOTS };
}
