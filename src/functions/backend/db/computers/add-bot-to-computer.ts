import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabUserComputer from "./grab-user-computer";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    computer_id: number | string;
};

/**
 * Gives one of the user's bots access to one of their computers. Adding a
 * bot that already has access is a no-op.
 */
export default async function addBotToComputer({
    user_id,
    bot_id,
    computer_id,
}: Params) {
    const bot = await grabUserBot({ bot_id, user_id });
    const computer = await grabUserComputer({ computer_id, user_id });

    if (!bot?.id || !computer?.id) {
        throw new AppError(`Bot or computer not found.`);
    }

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_computers (bot_id, computer_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        values: [bot.id, computer.id, Date.now(), Date.now()],
    });
}
