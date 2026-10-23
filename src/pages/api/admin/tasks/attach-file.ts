import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import attachTaskFile from "@/src/functions/backend/db/tasks/attach-task-file";
import grabTask from "@/src/functions/backend/db/tasks/grab-task";
import uploadAndRecordMedia from "@/src/functions/backend/db/users/media/upload-and-record-media";
import { AppData } from "@/src/data/app-data";
import { TaskFileRequestSchema, UploadTaskFileRequestSchema } from "@/src/schemas/task-schema";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import attachmentFileKind from "@/src/utils/attachment-file-kind";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import canExtractText from "@/src/utils/can-extract-text";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Links a file to a task: one of the user's own uploads (`media_id`), or a
 * new upload (`data_url` + `name`), saved as a private `media` row with
 * the `task-media` paradigm. Returns the task with its files.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<TaskDetail>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const data = (body || {}) as Record<string, unknown>;

        if (data.data_url) {
            const { task_id, data_url, name, kind } = parseWithSchema({
                schema: UploadTaskFileRequestSchema,
                data,
            });

            await assertUserReachesTask({ user_id: user.id, task_id });

            const mime = data_url.match(/^data:([^;,]*)/)?.[1] || "";
            const { media_type, ext } = attachmentFileKind({ mime, name });
            const { buffer } = await bufferFromBase64(data_url);

            if (!buffer.length) {
                throw new AppError(`${name} is empty.`);
            }

            if (buffer.length > AppData.BotAttachmentMaxBytes) {
                throw new AppError(
                    `${name} is too big. Files can be up to ${Math.round(AppData.BotAttachmentMaxBytes / 1024 / 1024)} MB.`,
                );
            }

            const saved = await uploadAndRecordMedia({
                data: buffer,
                media_type,
                media_mime_type: ext,
                media_paradigms: ["task-media"],
                media: { title: name },
                extract_media_text_content: canExtractText({ name, mime_type: mime }),
                user: { id: Number(user.id) },
            });

            if (!saved.singleRes?.id) {
                throw new AppError(`Couldn't save ${name}.`);
            }

            await attachTaskFile({
                task_id,
                media_id: saved.singleRes.id,
                user_id: user.id,
                kind: kind as never,
            });

            return { success: true, singleRes: await grabTask({ user_id: user.id, task_id }), msg: `File linked.` };
        }

        const { task_id, media_id, file_id, kind } = parseWithSchema({ schema: TaskFileRequestSchema, data });

        await assertUserReachesTask({ user_id: user.id, task_id });

        await attachTaskFile({
            task_id,
            media_id,
            file_id,
            user_id: user.id,
            kind: kind as never,
        });

        return { success: true, singleRes: await grabTask({ user_id: user.id, task_id }), msg: `File linked.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
