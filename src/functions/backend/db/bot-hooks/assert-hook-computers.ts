import type { BotHookSource } from "@/src/dict/bot-hook-dict";
import AppError from "@/src/utils/app-error";
import grabBotComputers from "../computers/grab-bot-computers";
import grabUserComputer from "../computers/grab-user-computer";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    source: BotHookSource;
    computer_id?: number | string | null;
    watch_computer_id?: number | string | null;
};

/**
 * Checks the computers a new hook would use: its runs' one must be one of
 * the bot's there, and a browser-notification hook needs a computer to
 * watch that both the bot and the user reach. Returns the computer its
 * runs use (a notification hook's defaults to the watched one), or null
 * for the bot's current one. Throws why when it can't.
 */
export default async function assertHookComputers({
    user_id,
    bot_id,
    workspace_id,
    source,
    computer_id,
    watch_computer_id,
}: Params) {
    const watching = source == "browser_notifications";
    const run_computer_id = computer_id || (watching ? watch_computer_id : null) || null;

    if (watching && !watch_computer_id) {
        throw new AppError(`Pick the computer whose notifications it gets.`);
    }

    if (run_computer_id || watch_computer_id) {
        const computers = await grabBotComputers({ bot_id, workspace_id });

        for (const id of [run_computer_id, watching ? watch_computer_id : null].filter(Boolean)) {
            if (!computers.some((c) => String(c.id) == String(id))) {
                throw new AppError(`This bot has no access to that computer.`);
            }
        }
    }

    if (watching && !(await grabUserComputer({ user_id, computer_id: watch_computer_id! }))?.id) {
        throw new AppError(`You have no access to that computer.`);
    }

    return run_computer_id;
}
