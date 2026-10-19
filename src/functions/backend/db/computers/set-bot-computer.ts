import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabBotComputers from "./grab-bot-computers";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    computer_id: number | string;
};

/**
 * Switches the computer a bot works on in its own chat
 * (`bots.computer_id`) to one of its own (`grabBotComputers`). In a
 * workspace the default computer is switched instead
 * (`setWorkspaceComputer`). Returns its computers, the new one first.
 */
export default async function setBotComputer({ bot_id, user_id, computer_id }: Params) {
    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    const computers = await grabBotComputers({ bot_id: bot.id, user_id });
    const computer = computers.find((c) => String(c.id) == String(computer_id));

    if (!computer?.id) {
        throw new AppError(`${bot.name || "This bot"} has no access to that computer.`);
    }

    await BunSQLite.sql({
        sql: `UPDATE bots SET computer_id = ?, updated_at = ? WHERE id = ?`,
        values: [computer.id, Date.now(), bot.id],
    });

    return {
        bot,
        computer,
        computers: [computer, ...computers.filter((c) => c.id != computer.id)],
    };
}
