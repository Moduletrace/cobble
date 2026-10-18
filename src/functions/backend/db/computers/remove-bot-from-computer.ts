import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import isLockedComputerAccess from "@/src/utils/is-locked-computer-access";
import grabUserBot from "../bots/grab-user-bot";
import grabUserComputer from "./grab-user-computer";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    computer_id: number | string;
};

/**
 * Takes a bot's access to a computer away. The coordinator's access to the
 * main computer can't be removed.
 */
export default async function removeBotFromComputer({
    user_id,
    bot_id,
    computer_id,
}: Params) {
    const bot = await grabUserBot({ bot_id, user_id });
    const computer = await grabUserComputer({ computer_id, user_id });

    if (!bot?.id || !computer?.id) {
        throw new AppError(`Bot or computer not found.`);
    }

    if (
        isLockedComputerAccess({
            bot_kind: bot.kind,
            computer_kind: computer.kind,
        })
    ) {
        throw new AppError(
            `The coordinator always has access to the main computer.`,
        );
    }

    await BunSQLite.sql({
        sql: `DELETE FROM bot_computers WHERE bot_id = ? AND computer_id = ?`,
        values: [bot.id, computer.id],
    });
}
