import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_TASKS,
    BUN_SQLITE_COBBLE_WORKSPACES,
} from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import type { TaskScope } from "@/src/utils/task-access/types";

/**
 * Reads a task's row as it is, without an access check: for the helpers
 * that already checked who is asking. Throws when it's gone.
 */
export default async function grabTaskRow({ task_id }: { task_id: number | string }) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_TASKS>({
        sql: `SELECT * FROM tasks WHERE id = ? LIMIT 1`,
        values: [Number(task_id)],
    });

    const task = res.payload?.[0];

    if (!task?.id) {
        throw new AppError(`Task not found.`);
    }

    return task;
}

/**
 * A task's collection (`bot_id` or `workspace_id`), for the access checks
 * that follow it.
 */
export function taskScopeOf({ task }: { task: BUN_SQLITE_COBBLE_TASKS }): TaskScope {
    return {
        bot_id: task.bot_id ? Number(task.bot_id) : null,
        workspace_id: task.workspace_id ? Number(task.workspace_id) : null,
    };
}

/**
 * Whether a task is still open (anything but done or cancelled).
 */
export function isOpenTask({ status }: { status?: string | null }) {
    return status != "done" && status != "cancelled";
}

export type TaskScopeTarget =
    | { kind: "bot"; bot: BUN_SQLITE_COBBLE_BOTS }
    | { kind: "workspace"; workspace: BUN_SQLITE_COBBLE_WORKSPACES };

/**
 * The bot or workspace a task collection names, read as it is. Throws when
 * it's gone, so a create never points at nothing.
 */
export async function grabTaskTarget(params: {
    bot_id?: number | null;
    workspace_id?: number | null;
}): Promise<TaskScopeTarget> {
    if (params.bot_id) {
        const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT * FROM bots WHERE id = ? LIMIT 1`,
            values: [Number(params.bot_id)],
        });
        const bot = res.payload?.[0];

        if (!bot?.id) throw new AppError(`Bot not found.`);

        return { kind: "bot", bot };
    }

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
        sql: `SELECT * FROM workspaces WHERE id = ? LIMIT 1`,
        values: [Number(params.workspace_id)],
    });
    const workspace = res.payload?.[0];

    if (!workspace?.id) throw new AppError(`Workspace not found.`);

    return { kind: "workspace", workspace };
}
