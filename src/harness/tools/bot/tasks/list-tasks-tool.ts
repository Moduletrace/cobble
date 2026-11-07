import { z } from "zod";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { type TaskStatus, TaskStatusValues } from "@/src/dict/task-dict";
import grabRunTask from "@/src/functions/backend/db/tasks/grab-run-task";
import grabTaskNotes from "@/src/functions/backend/db/tasks/grab-task-notes";
import grabTasks from "@/src/functions/backend/db/tasks/grab-tasks";
import grabTaskMedia from "@/src/functions/backend/db/tasks/grab-task-media";
import describeTaskLog from "./describe-task-log";
import type { HarnessTool } from "../../../types";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    is_coordinator: boolean;
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`).
     */
    admin_workspace_ids?: number[];
    /**
     * The workspace the run is in, if any.
     */
    workspace_id?: number | string | null;
};

type Args = {
    task_id?: number;
    scope?: "mine" | "workspace" | "all";
    status?: TaskStatus;
    open_only?: boolean;
};

/**
 * Lets a bot read the tasks it can work on: its own (its list and what it
 * has in workspaces), the workspace-wide ones in its workspaces, every task
 * of a workspace it's admin of, or for the coordinator the whole install.
 * Used both to plan work and to remind the user of what's pending. With
 * `task_id`, one task with its brief and whole log (who did what, when).
 */
export default function listTasksTool({ bot_id, user_id, is_coordinator, admin_workspace_ids, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "list_tasks",
        description: `List tasks: yours (your own list and the ones you have in workspaces), the ones in ${workspace_id ? "this workspace" : "a workspace"}, or ${is_coordinator ? "every task in the install" : "every task you can reach (yours, the workspace-wide ones in your workspaces, and as a workspace's admin every task there)"}. Each line is its id, status, title, whose it is, its files and its latest note with who wrote it. Open ones come first (blocked, then doing, then to do). Use it to plan work, and to check what's still pending when the user says hello or asks what's next. A workspace-wide task is worked on by every bot in its workspace: before you work on one, read it with task_id to see its brief and its whole log (which bot did what, and when), so you pick up where the others left off instead of redoing their part.`,
        schema: z.object({
            task_id: z
                .number()
                .int()
                .optional()
                .describe(`Read one task instead: its brief and its whole log, each note with the bot (or user) that wrote it and when.`),
            scope: z
                .enum(["mine", "workspace", "all"])
                .optional()
                .describe(`"mine" for the tasks you have (your own list and in workspaces; not the workspace-wide ones), "workspace" for ${workspace_id ? "this workspace's" : "a workspace's (none open)"}, "all" for everything you reach. Defaults to "all".`),
            status: z.enum(TaskStatusValues).optional(),
            open_only: z
                .boolean()
                .optional()
                .describe(`Only the open ones (to do, doing, blocked). Defaults to false.`),
        }),
        run: async ({ args }) => {
            if (args.task_id) {
                const task = await grabRunTask({ task_id: args.task_id, bot_id, is_coordinator, admin_workspace_ids });

                return describeTaskLog({
                    task,
                    notes: await grabTaskNotes({ task_id: task.id! }),
                    files: await grabTaskMedia({ task_id: task.id! }),
                    bot_id,
                });
            }

            const scope = args.scope || "all";
            const only_workspace_id =
                scope == "workspace" && workspace_id ? Number(workspace_id) : undefined;

            const tasks = await grabTasks({
                bot_id,
                is_coordinator,
                admin_workspace_ids,
                only_bot_id: scope == "mine" ? Number(bot_id) : undefined,
                only_workspace_id,
                statuses: args.status ? [args.status] : undefined,
                open_only: args.open_only || false,
                limit: AppData.TaskListToolLimit,
            });

            if (!tasks.length) {
                return args.open_only
                    ? `No open tasks${args.status ? ` with that status` : ""} here. Finished and cancelled ones aren't listed with open_only: list without it before saying a task is gone.`
                    : `No tasks${args.status ? ` with that status` : ""}.`;
            }

            const names = await grabWorkspaceNames({
                workspace_ids: tasks.map((task) => Number(task.workspace_id || 0)).filter(Boolean),
            });

            return tasks
                .map((task) => {
                    const who = task.bot_id ? task.bot_name || `bot ${task.bot_id}` : "workspace-wide, every bot there";
                    const where = task.workspace_id
                        ? `in ${names.get(Number(task.workspace_id)) || `workspace ${task.workspace_id}`}, ${who}`
                        : `on ${who}'s list`;
                    const bits = [
                        `#${task.id}`,
                        `[${task.status}]`,
                        task.title,
                        `(${where})`,
                        Number(task.media_count || 0) ? `${task.media_count} file(s)` : "",
                        task.status == "blocked" && task.blocked_reason ? `blocked: ${task.blocked_reason}` : "",
                        task.latest_note
                            ? `latest${task.latest_note_by ? ` by ${task.latest_note_by}` : " by the user"}: ${oneLine({ text: task.latest_note })}`
                            : "",
                    ];

                    return `- ${bits.filter(Boolean).join(" ")}`;
                })
                .join("\n");
        },
    };
}

/**
 * A note or reason on one line, so a list stays a list.
 */
function oneLine({ text }: { text: string }) {
    return String(text).replace(/\s+/g, " ").trim().slice(0, 160);
}

async function grabWorkspaceNames({ workspace_ids }: { workspace_ids: number[] }) {
    const names = new Map<number, string>();

    if (!workspace_ids.length) return names;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
        sql: `SELECT id, name FROM workspaces WHERE id IN (${workspace_ids.map(() => "?").join(", ")})`,
        values: workspace_ids,
    });

    for (const workspace of res.payload || []) {
        if (workspace.id) names.set(Number(workspace.id), workspace.name || `workspace ${workspace.id}`);
    }

    return names;
}
