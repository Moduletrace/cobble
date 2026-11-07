import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { type TaskStatus, TaskStatusValues } from "@/src/dict/task-dict";
import addTaskNote from "@/src/functions/backend/db/tasks/add-task-note";
import attachTaskFile from "@/src/functions/backend/db/tasks/attach-task-file";
import detachTaskFile from "@/src/functions/backend/db/tasks/detach-task-file";
import findDuplicateTask from "@/src/functions/backend/db/tasks/find-duplicate-task";
import grabTasks from "@/src/functions/backend/db/tasks/grab-tasks";
import grabRunTask from "@/src/functions/backend/db/tasks/grab-run-task";
import grabTaskMedia from "@/src/functions/backend/db/tasks/grab-task-media";
import makeTaskWorkspaceWide from "@/src/functions/backend/db/tasks/make-task-workspace-wide";
import grabBotById from "@/src/functions/backend/db/bots/grab-bot-by-id";
import updateTask from "@/src/functions/backend/db/tasks/update-task";
import type { StorageScope } from "@/src/utils/storage-access";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    is_coordinator: boolean;
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`).
     */
    admin_workspace_ids?: number[];
    /**
     * The run's folders, for linking a deliverable by its `[file:ID]` ref.
     */
    scopes?: StorageScope[];
};

type Args = {
    task_id: number;
    title?: string;
    description?: string;
    status?: TaskStatus;
    blocked_reason?: string;
    note?: string;
    deliverable_file_ids?: number[];
    reference_file_ids?: number[];
    unlink_file_ids?: number[];
    workspace_wide?: boolean;
};

/**
 * Lets a bot move a task along: rename it or rewrite its brief, set its
 * status, say what's blocking it, log a progress note, and file the
 * deliverables it produced. One call does all of them, so a step in the
 * work is a step in the log. Without the rename, bots told users they
 * couldn't fix a title and offered a second task for the same work. On a workspace-wide
 * task, which every bot there works on, the call's rename, status move and
 * filed files go into the log too, under the bot that did them, so the log says
 * which bot did what and when. The coordinator and a workspace's admin bot
 * can also turn a bot's task there into a workspace-wide one.
 */
export default function updateTaskTool({ user_id, bot_id, is_coordinator, admin_workspace_ids = [], scopes = [] }: Params): HarnessTool<Args> {
    /**
     * Only the coordinator and workspace admins get the switch at all.
     */
    const can_share = is_coordinator || admin_workspace_ids.length > 0;

    return {
        name: "update_task",
        description: `Move a task along. Rename it with title or rewrite its brief with description (never create a second task for the same work just to fix its name). Set its status (blocked needs a reason: what the user has to do), log a note of what you did or found, and file the files it produced. Call it as the work advances, not only at the end; every note is what the user sees on the task. A workspace-wide task is shared by every bot in its workspace: log a note for each part you do (it's recorded under your name and id, with the time) so the others see who did what, and don't mark it done while parts others are on are still open. Mark done only once you've verified the work (see the check note): starting a task isn't finishing it. To file a deliverable, save it first with write_file, make_pdf or generate_image, then pass its [file:ID] number. A task holds ${AppData.TaskMediaMaxPerTask} files: to make room, or to drop a superseded version, unlink files with unlink_file_ids (list_tasks with task_id shows what's filed; the file stays in its folder). Unlink first, then file, in the same call.${can_share ? ` As ${is_coordinator ? "the coordinator" : "a workspace's admin"}, workspace_wide: true turns a bot's open task in ${is_coordinator ? "a" : "your"} workspace into a workspace-wide one every bot there works on (hand it to one bot again with delegate_task).` : ""}`,
        schema: z.object({
            task_id: z.number().int(),
            title: z
                .string()
                .trim()
                .min(1)
                .max(AppData.TaskTitleMaxLength)
                .optional()
                .describe(`A new title, to rename it`),
            description: z
                .string()
                .max(AppData.TaskDescriptionMaxLength)
                .optional()
                .describe(`A new brief (markdown), replacing the whole old one`),
            status: z.enum(TaskStatusValues).optional(),
            blocked_reason: z
                .string()
                .max(AppData.TaskNoteMaxLength)
                .optional()
                .describe(`What the user has to do to unblock it; set with status blocked`),
            note: z
                .string()
                .max(AppData.TaskNoteMaxLength)
                .optional()
                .describe(`A line of progress for the task's log`),
            deliverable_file_ids: z
                .array(z.number().int())
                .optional()
                .describe(`The [file:ID] refs of what the task produced`),
            reference_file_ids: z
                .array(z.number().int())
                .optional()
                .describe(`The [file:ID] refs of files it works from`),
            unlink_file_ids: z
                .array(z.number().int())
                .optional()
                .describe(`The [file:ID] refs of files filed on the task to take off it (they stay in their folder). The user's own uploads can't be unlinked this way.`),
            workspace_wide: z
                .boolean()
                .optional()
                .describe(
                    can_share
                        ? `true to make a bot's open task in ${is_coordinator ? "a" : "a workspace you're admin of"} workspace workspace-wide: nobody's, for every bot there to work on and log. Only true does anything.`
                        : `Only the coordinator or a workspace's admin bot can use this; leave it out.`,
                ),
        }),
        run: async ({ args }) => {
            const task = await grabRunTask({ task_id: args.task_id, bot_id, is_coordinator, admin_workspace_ids });
            const said: string[] = [];
            const workspace_wide = !task.bot_id && Boolean(task.workspace_id);
            /**
             * On a workspace-wide task: what this call did, for the log.
             */
            const done: string[] = [];

            if (args.workspace_wide) {
                if (!can_share || (!is_coordinator && !admin_workspace_ids.includes(Number(task.workspace_id || 0)))) {
                    return `Only the coordinator or this workspace's admin bot can make a task workspace-wide.`;
                }

                await makeTaskWorkspaceWide({
                    task_id: task.id!,
                    by_bot_id: bot_id,
                    by_name: (await grabBotById({ bot_id }))?.name || `Bot ${bot_id}`,
                });
                said.push(`it's workspace-wide now, every bot in workspace ${task.workspace_id} works on it`);
            }

            const title = args.title?.trim();
            const renamed = Boolean(title) && title != (task.title || "").trim();
            const rewritten = args.description != undefined && args.description != (task.description || "");

            if (renamed) {
                const open = await grabTasks({
                    bot_id,
                    is_coordinator,
                    admin_workspace_ids,
                    only_workspace_id: task.workspace_id,
                    own_list: !task.workspace_id,
                    open_only: true,
                });

                const twin = findDuplicateTask({
                    tasks: open.filter((other) => other.id != task.id),
                    title: title!,
                    bot_id: task.bot_id ? Number(task.bot_id) : null,
                    workspace_id: task.workspace_id ? Number(task.workspace_id) : null,
                });

                if (twin) {
                    return `Task #${twin.id} "${twin.title}" is already open with that title, so #${task.id} wasn't renamed. If they're the same work, carry on with #${twin.id} and cancel #${task.id}.`;
                }
            }

            if (args.status == "blocked" && !args.blocked_reason?.trim()) {
                return `Blocked needs a reason: say in blocked_reason what the user has to do.`;
            }

            if (renamed || rewritten || args.status || args.blocked_reason !== undefined) {
                await updateTask({
                    user_id,
                    task_id: task.id!,
                    title: renamed ? title : undefined,
                    description: rewritten ? args.description : undefined,
                    status: args.status as never,
                    blocked_reason: args.blocked_reason ?? undefined,
                    updated_by_bot_id: bot_id,
                });

                if (renamed) {
                    said.push(`renamed to "${title}"`);
                    done.push(`Renamed it from "${task.title || "Task"}" to "${title}".`);
                } else if (title) {
                    said.push(`title was already "${title}"`);
                }

                if (rewritten) {
                    said.push(`brief rewritten`);
                    done.push(`Rewrote the brief.`);
                } else if (args.description != undefined) {
                    said.push(`brief was already that`);
                }

                if (args.status) {
                    said.push(task.status == args.status ? `status was already ${args.status}` : `status is now ${args.status}`);

                    if (task.status != args.status) {
                        done.push(
                            `Moved it from ${task.status} to ${args.status}${args.status == "blocked" && args.blocked_reason?.trim() ? `: ${args.blocked_reason.trim()}` : ""}.`,
                        );
                    }
                }
            }

            if (args.unlink_file_ids?.length) {
                const filed = await grabTaskMedia({ task_id: task.id! });

                for (const file_id of args.unlink_file_ids) {
                    const link = filed.find((file) => Number(file.bot_file_id || 0) == Number(file_id));

                    if (!link?.id) {
                        said.push(`file ${file_id} isn't filed on it`);
                        continue;
                    }

                    try {
                        await detachTaskFile({ task_id: task.id!, task_media_id: link.id, user_id });
                        said.push(`unlinked "${link.name}"`);
                        done.push(`Unlinked "${link.name}".`);
                    } catch (error: unknown) {
                        said.push(
                            `couldn't unlink file ${file_id}: ${error instanceof Error ? error.message : "unknown error"}`,
                        );
                    }
                }
            }

            for (const [kind, ids] of [
                ["deliverable", args.deliverable_file_ids],
                ["reference", args.reference_file_ids],
            ] as const) {
                for (const file_id of ids || []) {
                    try {
                        const { file, existed } = await attachTaskFile({
                            task_id: task.id!,
                            file_id,
                            user_id,
                            scopes,
                            kind,
                            added_by_bot_id: bot_id,
                        });

                        said.push(`${existed ? "already linked" : "linked"} ${kind} "${file.name}"`);

                        if (!existed) done.push(`Filed ${kind} "${file.name}".`);
                    } catch (error: unknown) {
                        said.push(
                            `couldn't link file ${file_id}: ${error instanceof Error ? error.message : "unknown error"}`,
                        );
                    }
                }
            }

            const note = [args.note?.trim(), workspace_wide ? done.join(" ") : ""].filter(Boolean).join("\n\n");

            if (note) {
                await addTaskNote({ task_id: task.id!, text: note, author: "bot", bot_id });
                said.push(args.note?.trim() ? `note logged` : `logged under your name`);
            }

            if (!said.length) {
                return `Nothing to change on #${task.id}.`;
            }

            const files = await grabTaskMedia({ task_id: task.id! });

            return `Task #${task.id} "${renamed ? title : task.title}": ${said.join(", ")}. It now carries ${files.length} file(s). Read it back with list_tasks before you tell the user.`;
        },
    };
}
