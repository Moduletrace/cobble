import BunSQLite from "@moduletrace/bun-sqlite";
import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import AppError from "@/src/utils/app-error";
import grabUserBot from "./grab-user-bot";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Deletes one of the user's worker bots with its conversations, tasks,
 * jobs, models and workspace places. A job it's running stops: it loses
 * its row. The coordinator can't be deleted.
 */
export default async function deleteBot({ user_id, bot_id }: Params) {
    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    if (bot.kind == "coordinator") {
        throw new AppError(`The coordinator can't be deleted.`);
    }

    const res = await BunSQLite.sql({ sql: `DELETE FROM bots WHERE id = ?`, values: [bot.id] });

    if (!res.success) {
        throw new Error(`Couldn't delete the bot: ${res.error}`);
    }

    if (bot.image_media_id) {
        await deleteMedia({ id: bot.image_media_id, user_id: Number(user_id) }).catch(() => {});
    }

    return bot;
}
