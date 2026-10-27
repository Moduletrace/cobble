import AppError from "@/src/utils/app-error";

type Params = {
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

/**
 * Where a task lives and who has it. A bot's own list is `bot_id` alone; a
 * workspace's task has `workspace_id`, plus `bot_id` when a bot there has
 * it (none: shared, not yet anyone's). Checked in the helpers rather than
 * the schema.
 */
export default function taskScopeValues({ bot_id, workspace_id }: Params) {
    const bot = bot_id ? Number(bot_id) : null;
    const workspace = workspace_id ? Number(workspace_id) : null;

    if (!bot && !workspace) {
        throw new AppError(`Say which bot or workspace the task is for.`);
    }

    return { bot_id: bot, workspace_id: workspace };
}
