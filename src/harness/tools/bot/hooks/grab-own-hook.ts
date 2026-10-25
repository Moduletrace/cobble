import grabUserBotHook from "@/src/functions/backend/db/bot-hooks/grab-user-bot-hook";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    hook_id: number | string;
};

/**
 * One of the user's hooks that this bot runs, or an `AppError`: a bot
 * never touches another bot's hooks.
 */
export default async function grabOwnHook({ user_id, bot_id, hook_id }: Params) {
    const hook = await grabUserBotHook({ user_id, hook_id });

    if (String(hook.bot_id) != String(bot_id)) {
        throw new AppError(`Hook #${hook_id} isn't one of yours.`);
    }

    return hook;
}
