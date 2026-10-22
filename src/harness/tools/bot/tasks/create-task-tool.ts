import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { type TaskStatus, TaskStatusValues } from "@/src/dict/task-dict";
import createTask from "@/src/functions/backend/db/tasks/create-task";
import findDuplicateTask from "@/src/functions/backend/db/tasks/find-duplicate-task";
import grabTasks from "@/src/functions/backend/db/tasks/grab-tasks";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace the run is in, if any: a bot adding a task there
     * defaults to the workspace's shared list.
     */
    workspace_id?: number | string | null;
    is_coordinator: boolean;
    /**
     * The coordinator's targets: every worker and live workspace. A worker
     * gets neither and may only add to its own list or the workspace it
     * works in.
     */
    workers?: BUN_SQLITE_COBBLE_BOTS[];
    workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[];
};

type Args = {
    title: string;
    description: string;
    bot_id?: number;
    workspace_id?: number;
    status?: TaskStatus;
};

type Place = { bot_id?: number; workspace_id?: number };

/**
 * Worked out from the arguments and who is asking: where the task goes, or
 * why it can't. A worker may only add to its own list or the workspace it
 * works in; the coordinator to any worker's, any workspace's, or its own.
 */
function resolvePlace({
    args,
    bot_id,
    workspace_id,
    is_coordinator,
}: {
    args: Args;
    bot_id: number | string;
    workspace_id?: number | string | null;
    is_coordinator: boolean;
}): Place | string {
    const target_bot = args.bot_id ? Number(args.bot_id) : null;
    const target_workspace = args.workspace_id ? Number(args.workspace_id) : null;

    if (target_bot && target_workspace) {
        return `A task belongs to a bot or a workspace, not both. Pick one.`;
    }

    if (is_coordinator) {
        if (target_workspace) return { workspace_id: target_workspace };
        if (target_bot) return { bot_id: target_bot };
        return { bot_id: Number(bot_id) };
    }

    if (target_bot && target_bot != Number(bot_id)) {
        return `You can only add tasks to your own list (#${bot_id}).`;
    }

    if (target_workspace && Number(workspace_id || 0) != target_workspace) {
        return `You can only add to this workspace's list (#${workspace_id || "none"}) or your own.`;
    }

    if (target_workspace) return { workspace_id: target_workspace };
    if (target_bot) return { bot_id: target_bot };

    /**
     * In a workspace, the workspace's list is the right home: work there is
     * shared work.
     */
    return workspace_id ? { workspace_id: Number(workspace_id) } : { bot_id: Number(bot_id) };
}

/**
 * Lets a bot add a task to a list it works on: its own, or a workspace's.
 * The coordinator can add to any worker's list and any workspace's.
 */
export default function createTaskTool({
    user_id,
    bot_id,
    workspace_id,
    is_coordinator,
    workers = [],
    workspaces = [],
}: Params): HarnessTool<Args> {
    const crew = workers.map((worker) => `${worker.id}: ${worker.name}`).join("; ");
    const places = workspaces.map((workspace) => `${workspace.id}: ${workspace.name}`).join("; ");

    return {
        name: "create_task",
        description: is_coordinator
            ? `Add a task to a list: a worker's own (${crew || "no workers yet"}), a workspace's shared one (${places || "no workspaces yet"}), or your own (leave both ids out). Write the description as a brief: what to do, where, and how you'll know it's done. A workspace's tasks are visible to every bot working there.`
            : `Add a task to a list: ${workspace_id ? "this workspace's shared one (leave the ids out), or your own (bot_id: " + bot_id + ")" : "your own (leave the ids out)"}. Write the description as a brief: what to do, where, and how you'll know it's done.`,
        schema: z.object({
            title: z.string().trim().min(1).max(AppData.TaskTitleMaxLength).describe(`A short label`),
            description: z
                .string()
                .max(AppData.TaskDescriptionMaxLength)
                .describe(`The brief, in markdown: what to do, where, and what done looks like`),
            bot_id: z.number().int().optional().describe(
                is_coordinator
                    ? `Whose own list, when it isn't a workspace's. Leave out for your own.`
                    : `Your own id (${bot_id}), to keep it in your list rather than the workspace's.`,
            ),
            workspace_id: z
                .number()
                .int()
                .optional()
                .describe(
                    is_coordinator
                        ? `A workspace's shared list, when it isn't a bot's own.`
                        : `This workspace's shared list (${workspace_id || "none"}).`,
                ),
            status: z.enum(TaskStatusValues).optional().describe(`Defaults to to do`),
        }),
        run: async ({ args }) => {
            const place = resolvePlace({ args, bot_id, workspace_id, is_coordinator });

            if (typeof place == "string") return place;

            const existing = await grabTasks({
                bot_id,
                is_coordinator,
                only_bot_id: place.bot_id,
                only_workspace_id: place.workspace_id,
                open_only: true,
            });

            const twin = findDuplicateTask({
                tasks: existing,
                title: args.title,
                bot_id: place.bot_id || null,
                workspace_id: place.workspace_id || null,
            });

            if (twin) {
                return `Task #${twin.id} "${twin.title}" is already open with that title. Update it with update_task instead of adding a second one for the same work.`;
            }

            const task = await createTask({
                user_id,
                bot_id: place.bot_id,
                workspace_id: place.workspace_id,
                title: args.title,
                description: args.description,
                status: args.status as never,
                created_by_bot_id: bot_id,
            });

            return `Task #${task.id} "${task.title}" added ${place.workspace_id ? "to this workspace's list" : "to your list"}. Check it with list_tasks before you mention it to the user.`;
        },
    };
}
