import AppError from "@/src/utils/app-error";
import grabBotHooks from "./grab-bot-hooks";

type Params = {
    user_id: number | string;
    hook_id: number | string;
};

/**
 * One of the user's hooks. Throws when it isn't theirs.
 */
export default async function grabUserBotHook({ user_id, hook_id }: Params) {
    const [hook] = await grabBotHooks({ user_id, hook_id });

    if (!hook?.id) {
        throw new AppError(`Hook #${hook_id} not found.`);
    }

    return hook;
}
