import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";

type Params = {
    tasks: BUN_SQLITE_COBBLE_TASKS[];
    title: string;
    /**
     * Same list: a bot's own, or a workspace's (whoever has it there).
     */
    bot_id?: number | null;
    workspace_id?: number | null;
    /**
     * The part's parent: two parts of different parents may share a title
     * ("Write the intro" under two releases), the same parent's may not.
     */
    parent_task_id?: number | null;
};

/**
 * A task in the same collection with the same title that's still open, so
 * `ActionCheckNote` gets real behaviour: a bot updates the existing task
 * instead of adding a second one for the same work.
 */
export default function findDuplicateTask({ tasks, title, bot_id, workspace_id, parent_task_id }: Params) {
    const wanted = title.trim().toLowerCase();

    return (
        tasks.find((task) => {
            if (task.status == "done" || task.status == "cancelled") return false;
            if (workspace_id) {
                if (Number(task.workspace_id || 0) != Number(workspace_id)) return false;
            } else if (task.workspace_id || Number(task.bot_id || 0) != Number(bot_id || 0)) {
                return false;
            }

            if (Number(task.parent_task_id || 0) != Number(parent_task_id || 0)) return false;

            return (task.title || "").trim().toLowerCase() == wanted;
        }) || null
    );
}
