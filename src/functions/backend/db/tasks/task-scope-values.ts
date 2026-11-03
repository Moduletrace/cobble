import AppError from "@/src/utils/app-error";

type Params = {
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
    /**
     * A workspace's task nobody has: every bot working there sees it, works
     * on it and logs what it did. Only ever asked for, never the fallback.
     */
    workspace_wide?: boolean;
};

/**
 * Where a task lives and who has it. A task belongs to a bot by default: a
 * bot's own list is `bot_id` alone, a workspace's task has `workspace_id`
 * plus the `bot_id` that has it there. The one exception is a workspace-wide
 * task (`workspace_id` with no bot), which must be asked for. Checked in the
 * helpers rather than the schema.
 */
export default function taskScopeValues({ bot_id, workspace_id, workspace_wide }: Params) {
    const bot = bot_id ? Number(bot_id) : null;
    const workspace = workspace_id ? Number(workspace_id) : null;

    if (workspace_wide) {
        if (!workspace) {
            throw new AppError(`A workspace-wide task needs its workspace.`);
        }

        if (bot) {
            throw new AppError(`A workspace-wide task is nobody's: leave the bot out, or give it to that bot instead.`);
        }

        return { bot_id: null, workspace_id: workspace };
    }

    if (!bot) {
        throw new AppError(`Say which bot has the task.`);
    }

    return { bot_id: bot, workspace_id: workspace };
}
