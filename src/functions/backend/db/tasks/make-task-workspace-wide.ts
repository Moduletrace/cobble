import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import grabBotById from "../bots/grab-bot-by-id";
import addTaskNote from "./add-task-note";
import grabTaskRow, { isOpenTask } from "./grab-task-scope";
import moveTask from "./move-task";

type Params = {
    task_id: number | string;
    /**
     * Who switches it, for the log: the bot's run (also the note's author),
     * or none when a user does.
     */
    by_bot_id?: number | string | null;
    /**
     * Who switches it, by name, for the log.
     */
    by_name: string;
};

/**
 * Turns a bot's open task in a workspace into a workspace-wide one, which
 * every bot there sees and works on, with a note saying who did it and
 * whose it was. The caller checked who is asking may: a crew manager, the
 * coordinator, or that workspace's admin bot. A task on a bot's own list
 * has no workspace to belong to and is refused. Returns the row as it is
 * now.
 */
export default async function makeTaskWorkspaceWide({
    task_id,
    by_bot_id,
    by_name,
}: Params): Promise<BUN_SQLITE_COBBLE_TASKS> {
    const task = await grabTaskRow({ task_id });

    if (!task.workspace_id) {
        throw new AppError(`Task #${task.id} is on a bot's own list, not in a workspace, so it can't be workspace-wide.`);
    }

    if (!task.bot_id) {
        throw new AppError(`Task #${task.id} is already workspace-wide.`);
    }

    if (!isOpenTask({ status: task.status })) {
        throw new AppError(`Task #${task.id} is ${task.status}. Only an open task can be made workspace-wide.`);
    }

    const was = (await grabBotById({ bot_id: task.bot_id }))?.name || `bot ${task.bot_id}`;
    const moved = await moveTask({ task_id: task.id!, workspace_id: task.workspace_id, workspace_wide: true });

    await addTaskNote({
        task_id: task.id!,
        text: `${by_name} made this workspace-wide (it was ${was}'s): every bot in the workspace works on it now.`,
        author: by_bot_id ? "bot" : "user",
        bot_id: by_bot_id || null,
    });

    return moved;
}
