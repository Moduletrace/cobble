import BunSQLite from "@moduletrace/bun-sqlite";
import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import purgeStorage, { grabStorageMediaIds } from "@/src/functions/backend/db/bot-files/purge-storage";
import { grabTaskMediaIds } from "@/src/functions/backend/db/tasks/purge-task-media";
import AppError from "@/src/utils/app-error";
import grabUserBot from "./grab-user-bot";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";

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
    await assertCrewManager({ user_id });

    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    if (bot.kind == "coordinator") {
        throw new AppError(`The coordinator can't be deleted.`);
    }

    /**
     * Read before the delete: the files' rows go with the bot, and so do its
     * tasks and the links to what they filed.
     */
    const file_media_ids = await grabStorageMediaIds({ scope: "bot", owner_id: bot.id! }).catch(
        () => [],
    );
    const task_media_ids = await grabTaskMediaIds({ bot_id: bot.id! }).catch(() => []);

    /**
     * Explicitly, since foreign keys are off outside the server process.
     */
    await BunSQLite.sql({ sql: `DELETE FROM bot_types WHERE bot_id = ?`, values: [bot.id] });

    const res = await BunSQLite.sql({ sql: `DELETE FROM bots WHERE id = ?`, values: [bot.id] });

    if (!res.success) {
        throw new Error(`Couldn't delete the bot: ${res.error}`);
    }

    if (bot.image_media_id) {
        await deleteMedia({ id: bot.image_media_id, user_id: Number(user_id) }).catch(() => {});
    }

    /**
     * What the bot's tasks filed and no folder owns (a chat upload): the
     * links went with the tasks, so these bytes would be stranded.
     */
    await deleteMedia({ ids: task_media_ids, user_id: Number(user_id), can_delete_all_media: true }).catch(
        () => {},
    );

    /**
     * Its folder goes with it: the bytes, their `media` rows and the search
     * vectors.
     */
    await purgeStorage({ scope: "bot", owner_id: bot.id!, media_ids: file_media_ids });

    return bot;
}
