import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import grabSubtaskParents from "@/src/functions/backend/db/tasks/grab-subtask-parents";
import { TaskIdRequestSchema } from "@/src/schemas/task-schema";
import type { TaskWithNames } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * What a bot's task can be made a subtask of: its workspace's open
 * workspace-wide tasks (`grabSubtaskParents`), loaded when the picker opens
 * so the page's props stay small. Crew managers only, since it's their
 * picker.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<TaskWithNames>> = async ({ req, body }) => {
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

        if (!canManageCrew({ user_types: user_types || [] })) {
            throw new AppError(`Only an admin can make a task a subtask of another.`);
        }

        const { task_id } = parseWithSchema({ schema: TaskIdRequestSchema, data: body });
        const task = await assertUserReachesTask({ user_id: user.id, task_id });

        return { success: true, payload: await grabSubtaskParents({ user_id: user.id, task }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};