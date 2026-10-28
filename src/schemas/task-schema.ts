import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import { TaskMediaKinds, TaskStatuses } from "@/src/dict/task-dict";

const status_values = TaskStatuses.map((status) => status.value) as [string, ...string[]];
const media_kind_values = TaskMediaKinds.map((kind) => kind.value) as [string, ...string[]];

/**
 * Where it goes: a bot's own list (`bot_id`) or a bot's task in a
 * workspace (both). Every task has a bot: the helper refuses one without
 * (`taskScopeValues`).
 */
const scope = {
    bot_id: z.number().int().positive().optional(),
    workspace_id: z.number().int().positive().optional(),
};

export const CreateTaskRequestSchema = z.object({
    ...scope,
    title: z.string().trim().min(1).max(AppData.TaskTitleMaxLength),
    description: z.string().max(AppData.TaskDescriptionMaxLength).optional(),
    status: z.enum(status_values).optional(),
});

export const UpdateTaskRequestSchema = z.object({
    task_id: z.number().int().positive(),
    title: z.string().trim().min(1).max(AppData.TaskTitleMaxLength).optional(),
    description: z.string().max(AppData.TaskDescriptionMaxLength).optional(),
    status: z.enum(status_values).optional(),
    blocked_reason: z.string().max(AppData.TaskNoteMaxLength).nullable().optional(),
});

export const DeleteTaskRequestSchema = z.object({
    task_id: z.number().int().positive(),
});

export const TaskNoteRequestSchema = z.object({
    task_id: z.number().int().positive(),
    text: z.string().trim().min(1).max(AppData.TaskNoteMaxLength),
});

/**
 * Linking a file: one from the run's folders (or the user's own uploads)
 * or a fresh upload, already saved as a private `media` row.
 */
export const TaskFileRequestSchema = z.object({
    task_id: z.number().int().positive(),
    file_id: z.number().int().positive().optional(),
    media_id: z.number().int().positive().optional(),
    kind: z.enum(media_kind_values).optional(),
});

export const DetachTaskFileRequestSchema = z
    .object({
        task_id: z.number().int().positive(),
        task_media_id: z.number().int().positive().optional(),
        media_id: z.number().int().positive().optional(),
    })
    .refine((body) => Boolean(body.task_media_id || body.media_id), {
        message: "Which file?",
    });

/**
 * Uploading one deliverable straight onto a task, like a chat attachment.
 */
export const UploadTaskFileRequestSchema = z.object({
    task_id: z.number().int().positive(),
    data_url: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(media_kind_values).optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;
export type TaskNoteRequest = z.infer<typeof TaskNoteRequestSchema>;
export type TaskFileRequest = z.infer<typeof TaskFileRequestSchema>;

export const HandOverTaskRequestSchema = z.object({
    task_id: z.number().int().positive(),
    bot_id: z.number().int().positive("Pick a bot"),
    instructions: z.string().max(AppData.TaskDescriptionMaxLength).optional(),
});

export const TaskIdRequestSchema = z.object({
    task_id: z.number().int().positive(),
});
