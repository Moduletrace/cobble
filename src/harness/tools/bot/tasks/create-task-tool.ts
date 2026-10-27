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
     * The workspace the run is in, if any: a worker's task there stays in
     * it, its own by default.
     */
    workspace_id?: number | string | null;
    is_coordinator: boolean;
    /**
     * The coordinator's targets: every worker and live workspace. A worker
     * gets neither and may only add to its own list or in the workspace it
     * works in.
     */
    workers?: BUN_SQLITE_COBBLE_BOTS[];
    workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[];
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`).
     */
    admin_workspace_ids?: number[];
    /**
     * In a workspace it's admin of: the other bots there, whose own lists
     * it may add to.
     */
    members?: BUN_SQLITE_COBBLE_BOTS[];
};

type Args = {
    title: string;
    description: string;
    bot_id?: number;
    workspace_id?: number;
    shared?: boolean;
    status?: TaskStatus;
};

type Place = { bot_id?: number; workspace_id?: number };

/**
 * Worked out from the arguments and who is asking: where the task goes and
 * who has it, or why it can't. Outside a workspace a worker adds only to
 * its own list. In one the task stays in that workspace: its own by
 * default, a member's as the workspace's admin, or shared (nobody's yet).
 * The coordinator adds to any worker's own list or any workspace, for one
 * of its bots or shared.
 */
function resolvePlace({
    args,
    bot_id,
    workspace_id,
    is_coordinator,
    members = [],
}: {
    args: Args;
    bot_id: number | string;
    workspace_id?: number | string | null;
    is_coordinator: boolean;
    members?: BUN_SQLITE_COBBLE_BOTS[];
}): Place | string {
    const target_bot = args.bot_id ? Number(args.bot_id) : null;
    const target_workspace = args.workspace_id ? Number(args.workspace_id) : null;

    if (args.shared && target_bot) {
        return `A shared task is nobody's yet: leave bot_id out, or drop shared to give it to that bot.`;
    }

    if (is_coordinator) {
        const place_workspace = target_workspace || (workspace_id ? Number(workspace_id) : null);

        if (place_workspace) {
            return target_bot ? { workspace_id: place_workspace, bot_id: target_bot } : { workspace_id: place_workspace };
        }

        return { bot_id: target_bot || Number(bot_id) };
    }

    if (!workspace_id) {
        if (target_workspace || args.shared) {
            return `You're not in a workspace here, so a task can only go on your own list (bot_id ${bot_id}).`;
        }

        if (target_bot && target_bot != Number(bot_id)) {
            return `You can only add tasks to your own list (#${bot_id}).`;
        }

        return { bot_id: Number(bot_id) };
    }

    if (target_workspace && target_workspace != Number(workspace_id)) {
        return `You can only add tasks in this workspace (#${workspace_id}).`;
    }

    if (args.shared) return { workspace_id: Number(workspace_id) };

    const is_member = members.some((member) => member.id == target_bot);

    if (target_bot && target_bot != Number(bot_id) && !is_member) {
        return members.length
            ? `You can only give a task here to yourself (#${bot_id}) or a member (${members.map((m) => m.id).join(", ")}), or leave it shared.`
            : `You can only give a task here to yourself (#${bot_id}), or leave it shared.`;
    }

    return { workspace_id: Number(workspace_id), bot_id: target_bot || Number(bot_id) };
}

/**
 * Lets a bot add a task to a list it works on: its own, or in a workspace
 * its own there (a member's as its admin) or a shared one. The coordinator
 * can add to any worker's list and any workspace.
 */
export default function createTaskTool({
    user_id,
    bot_id,
    workspace_id,
    is_coordinator,
    workers = [],
    workspaces = [],
    admin_workspace_ids = [],
    members = [],
}: Params): HarnessTool<Args> {
    const crew = workers.map((worker) => `${worker.id}: ${worker.name}`).join("; ");
    const places = workspaces.map((workspace) => `${workspace.id}: ${workspace.name}`).join("; ");
    const team = members.map((member) => `${member.id}: ${member.name}`).join("; ");

    return {
        name: "create_task",
        description: is_coordinator
            ? `Add a task: to a worker's own list (bot_id: ${crew || "no workers yet"}), to a workspace (workspace_id: ${places || "no workspaces yet"}) for one of its bots (with bot_id) or shared (without), or to your own list (leave both ids out${workspace_id ? "; here, leaving them out makes it a shared task in this workspace" : ""}). Write the description as a brief: what to do, where, and how you'll know it's done.`
            : `Add a task: ${workspace_id ? `in this workspace, yours by default${team ? `, a member's as this workspace's admin (bot_id: ${team})` : ""}, or shared (shared: true) for whichever bot here takes it up` : `on your own list (bot_id ${bot_id}, the default)`}. Write the description as a brief: what to do, where, and how you'll know it's done.`,
        schema: z.object({
            title: z.string().trim().min(1).max(AppData.TaskTitleMaxLength).describe(`A short label`),
            description: z
                .string()
                .max(AppData.TaskDescriptionMaxLength)
                .describe(`The brief, in markdown: what to do, where, and what done looks like`),
            bot_id: z.number().int().optional().describe(
                is_coordinator
                    ? `Who has it: a worker's own list, or with workspace_id a bot working there. Leave out for your own list or a shared workspace task.`
                    : team
                      ? `Who has it here: you (${bot_id}, the default) or a member (${team}).`
                      : `Your own id (${bot_id}); leaving it out has the same effect.`,
            ),
            workspace_id: z
                .number()
                .int()
                .optional()
                .describe(
                    is_coordinator
                        ? `The workspace it's in, when it isn't a bot's own list.`
                        : `This workspace (${workspace_id || "none"}); leaving it out has the same effect.`,
                ),
            shared: z
                .boolean()
                .optional()
                .describe(`In a workspace: nobody's yet, for whichever bot there takes it up. Defaults to false.`),
            status: z.enum(TaskStatusValues).optional().describe(`Defaults to to do`),
        }),
        run: async ({ args }) => {
            const place = resolvePlace({ args, bot_id, workspace_id, is_coordinator, members });

            if (typeof place == "string") return place;

            const existing = await grabTasks({
                bot_id,
                is_coordinator,
                admin_workspace_ids,
                only_bot_id: place.workspace_id ? undefined : place.bot_id,
                only_workspace_id: place.workspace_id,
                own_list: !place.workspace_id,
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

            const where = place.workspace_id
                ? `in workspace ${place.workspace_id}, ${!place.bot_id ? "shared" : place.bot_id == Number(bot_id) ? "yours" : `bot ${place.bot_id}'s`}`
                : place.bot_id == Number(bot_id)
                  ? "to your list"
                  : `to bot ${place.bot_id}'s list`;

            return `Task #${task.id} "${task.title}" added ${where}. Check it with list_tasks before you mention it to the user.`;
        },
    };
}
