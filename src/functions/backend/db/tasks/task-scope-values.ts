import AppError from "@/src/utils/app-error";

type Params = {
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

/**
 * Where a task lives and who has it. Every task belongs to a bot: a bot's
 * own list is `bot_id` alone, a workspace's task has `workspace_id` plus
 * the `bot_id` that has it there. Checked in the helpers rather than the
 * schema.
 */
export default function taskScopeValues({ bot_id, workspace_id }: Params) {
    const bot = bot_id ? Number(bot_id) : null;
    const workspace = workspace_id ? Number(workspace_id) : null;

    if (!bot) {
        throw new AppError(`Say which bot has the task.`);
    }

    return { bot_id: bot, workspace_id: workspace };
}
