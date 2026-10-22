import AppError from "@/src/utils/app-error";

type Params = {
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

/**
 * A task belongs to exactly one collection: a bot's own list, or a
 * workspace's shared one. Checked in the helpers rather than the schema,
 * since SQLite treats NULL in a unique constraint as always distinct (the
 * `envs` precedent).
 */
export default function taskScopeValues({ bot_id, workspace_id }: Params) {
    const bot = bot_id ? Number(bot_id) : null;
    const workspace = workspace_id ? Number(workspace_id) : null;

    if (bot && workspace) {
        throw new AppError(`A task belongs to a bot or a workspace, not both.`);
    }

    if (!bot && !workspace) {
        throw new AppError(`Say which bot or workspace the task is for.`);
    }

    return { bot_id: bot, workspace_id: workspace };
}
