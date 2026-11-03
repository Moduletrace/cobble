type Params = {
    task: {
        bot_id?: number | string | null;
        bot_name?: string | null;
        workspace_id?: number | string | null;
        workspace_name?: string | null;
    };
};

/**
 * Where a task is and who has it, for a list row: "Ada" for a bot's own
 * list, "Ada in Launch" for a bot's task in a workspace, "Every bot in
 * Launch" for a workspace-wide one.
 */
export default function taskPlaceLabel({ task }: Params) {
    const bot = task.bot_id ? task.bot_name || `Bot ${task.bot_id}` : null;

    if (!task.workspace_id) return bot || "";

    const workspace = task.workspace_name || `Workspace ${task.workspace_id}`;

    return `${bot || "Every bot"} in ${workspace}`;
}
