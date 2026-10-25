import AppError from "./app-error";

type Params = {
    /**
     * The workspace the task's list or the routine belongs to now; none
     * for a bot's own.
     */
    workspace_id?: number | string | null;
    /**
     * The workspace asked for, if any.
     */
    asked_workspace_id?: number | string | null;
    /**
     * What is handed over, for the refusal ("Task #4").
     */
    label: string;
};

/**
 * Where handed-over work runs from now: a task on a workspace's list or a
 * routine in a workspace stays in that workspace, and asking for another
 * is refused; a bot's own goes to the asked workspace, or the new bot's
 * own chat (null).
 */
export default function handOverPlace({ workspace_id, asked_workspace_id, label }: Params): number | null {
    if (workspace_id) {
        if (asked_workspace_id && Number(asked_workspace_id) != Number(workspace_id)) {
            throw new AppError(`${label} belongs to workspace ${workspace_id}, and stays there. Leave workspace_id out.`);
        }

        return Number(workspace_id);
    }

    return asked_workspace_id ? Number(asked_workspace_id) : null;
}
