import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import createTask from "@/src/functions/backend/db/tasks/create-task";
import updateTask from "@/src/functions/backend/db/tasks/update-task";
import { CreateTaskRequestSchema, UpdateTaskRequestSchema } from "@/src/schemas/task-schema";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Adds a task to a bot's list or a workspace's (`bot_id` or
 * `workspace_id`), or changes one (`task_id`). Returns the task with its
 * notes and files.
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

        if (data.task_id) {
            const { task_id, title, description, status, blocked_reason } = parseWithSchema({
                schema: UpdateTaskRequestSchema,
                data,
            });

            await assertUserReachesTask({ user_id: user.id, task_id });

            return {
                success: true,
                singleRes: await updateTask({
                    user_id: user.id,
                    task_id,
                    title,
                    description,
                    status: status as never,
                    blocked_reason,
                }),
                msg: `Saved.`,
            };
        }

        const { bot_id, workspace_id, title, description, status } = parseWithSchema({
            schema: CreateTaskRequestSchema,
            data,
        });

        return {
            success: true,
            singleRes: await createTask({
                user_id: user.id,
                bot_id,
                workspace_id,
                title,
                description,
                status: status as never,
            }),
            msg: `Task added.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
