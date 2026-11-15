import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import detachSubtask from "@/src/functions/backend/db/tasks/detach-subtask";
import grabTask from "@/src/functions/backend/db/tasks/grab-task";
import { DetachSubtaskRequestSchema } from "@/src/schemas/task-schema";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Takes a subtask out of its workspace-wide task, leaving a task of its own
 * bot in the workspace (`detachSubtask`): the only way a parent with subtasks
 * is ever moved, and the button a crew manager has for it. Crew managers
 * only, like every other change to a task by hand. Returns the task as it
 * is now.
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

        if (!canManageCrew({ user_types: user_types || [] })) {
            throw new AppError(`Only an admin can unlink a subtask from its task.`);
        }

        const { task_id } = parseWithSchema({ schema: DetachSubtaskRequestSchema, data: body });

        await assertUserReachesTask({ user_id: user.id, task_id });
        await detachSubtask({ task_id, by_name: user.first_name || user.username || "The user" });

        return {
            success: true,
            singleRes: await grabTask({ user_id: user.id, task_id }),
            msg: `It's a task of its own now.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};