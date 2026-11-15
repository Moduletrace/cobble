import { OpenTaskStatuses } from "@/src/dict/task-dict";

type ParentLike = {
    id?: number | string | null;
    title?: string | null;
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
    parent_task_id?: number | string | null;
    status?: string | null;
};

type Params = {
    /**
     * The task it would be a part of, read as it is; none when the id names
     * nothing.
     */
    parent?: ParentLike | null;
    /**
     * Who would have the part.
     */
    bot_id?: number | string | null;
    /**
     * The workspace the part would be created in.
     */
    workspace_id?: number | string | null;
};

/**
 * Why a task can't be a part of that one, or null when it can. A part is a
 * bot's own task in its parent's workspace, and its parent is a
 * workspace-wide task that is no one's and isn't itself a part: one level
 * of splitting, so a part can never be split again or drift to another
 * workspace.
 */
export default function subtaskLinkProblem({ parent, bot_id, workspace_id }: Params): string | null {
    if (!parent?.id) return `That task doesn't exist, so nothing can be a part of it.`;

    const label = `Task #${parent.id}${parent.title ? ` "${parent.title}"` : ""}`;

    if (parent.parent_task_id) {
        return `${label} is itself a part of task #${parent.parent_task_id}: a part can't be split again.`;
    }

    if (parent.bot_id || !parent.workspace_id) {
        return `${label} isn't workspace-wide, so it has no parts: only a workspace-wide task can be split.`;
    }

    if (!bot_id) {
        return `A part belongs to one bot: say which bot has it (leave workspace-wide out).`;
    }

    if (Number(parent.workspace_id) != Number(workspace_id || 0)) {
        return `${label} is in ${parent.workspace_id == null ? "no workspace" : `workspace ${parent.workspace_id}`}: a part of it has to be in that same workspace.`;
    }

    if (!OpenTaskStatuses.includes(parent.status as (typeof OpenTaskStatuses)[number])) {
        return `${label} is ${parent.status}: a closed task can't be split.`;
    }

    return null;
}