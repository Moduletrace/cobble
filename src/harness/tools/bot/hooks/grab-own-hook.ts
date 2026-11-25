import grabUserBotHook from "@/src/functions/backend/db/bot-hooks/grab-user-bot-hook";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    hook_id: number | string;
    /**
     * The coordinator reaches every hook the user has, not only its own.
     */
    is_coordinator?: boolean;
    /**
     * The workspace the run is in: only a hook that runs there.
     */
    workspace_id?: number | string | null;
};

/**
 * One of the user's hooks that this bot runs, or an `AppError`: a bot
 * never touches another bot's hooks, except the coordinator, which the
 * user made responsible for the whole crew. In a workspace only that
 * workspace's hooks are within reach.
 */
export default async function grabOwnHook({ user_id, bot_id, hook_id, is_coordinator, workspace_id }: Params) {
    const hook = await grabUserBotHook({ user_id, hook_id, workspace_id });

    if (!is_coordinator && String(hook.bot_id) != String(bot_id)) {
        throw new AppError(`Hook #${hook_id} isn't one of yours.`);
    }

    return hook;
}