import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { type TaskStatus, TaskStatusValues } from "@/src/dict/task-dict";
import addTaskNote from "@/src/functions/backend/db/tasks/add-task-note";
import attachTaskFile from "@/src/functions/backend/db/tasks/attach-task-file";
import grabRunTask from "@/src/functions/backend/db/tasks/grab-run-task";
import grabTaskMedia from "@/src/functions/backend/db/tasks/grab-task-media";
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
    status?: TaskStatus;
    blocked_reason?: string;
    note?: string;
    deliverable_file_ids?: number[];
    reference_file_ids?: number[];
};

/**
 * Lets a bot move a task along: set its status, say what's blocking it, log
 * a progress note, and file the deliverables it produced. One call does all
 * of them, so a step in the work is a step in the log.
 */
export default function updateTaskTool({ user_id, bot_id, is_coordinator, admin_workspace_ids, scopes = [] }: Params): HarnessTool<Args> {
    return {
        name: "update_task",
        description: `Move a task along. Set its status (blocked needs a reason: what the user has to do), log a note of what you did or found, and file the files it produced. Call it as the work advances, not only at the end; every note is what the user sees on the task. Mark done only once you've verified the work (see the check note): starting a task isn't finishing it. To file a deliverable, save it first with write_file, make_pdf or generate_image, then pass its [file:ID] number.`,
        schema: z.object({
            task_id: z.number().int(),
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
        }),
        run: async ({ args }) => {
            const task = await grabRunTask({ task_id: args.task_id, bot_id, is_coordinator, admin_workspace_ids });
            const said: string[] = [];

            if (args.status || args.blocked_reason !== undefined) {
                if (args.status == "blocked" && !args.blocked_reason?.trim()) {
                    return `Blocked needs a reason: say in blocked_reason what the user has to do.`;
                }

                await updateTask({
                    user_id,
                    task_id: task.id!,
                    status: args.status as never,
                    blocked_reason: args.blocked_reason ?? undefined,
                    updated_by_bot_id: bot_id,
                });

                if (args.status) {
                    said.push(task.status == args.status ? `status was already ${args.status}` : `status is now ${args.status}`);
                }
            }

            if (args.note?.trim()) {
                await addTaskNote({ task_id: task.id!, text: args.note, author: "bot", bot_id });
                said.push(`note logged`);
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
                    } catch (error: unknown) {
                        said.push(
                            `couldn't link file ${file_id}: ${error instanceof Error ? error.message : "unknown error"}`,
                        );
                    }
                }
            }

            if (!said.length) {
                return `Nothing to change on #${task.id}.`;
            }

            const files = await grabTaskMedia({ task_id: task.id! });

            return `Task #${task.id} "${task.title}": ${said.join(", ")}. It now carries ${files.length} file(s). Read it back with list_tasks before you tell the user.`;
        },
    };
}
