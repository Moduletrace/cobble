import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import linkSubtask from "@/src/functions/backend/db/tasks/link-subtask";
import { LinkSubtaskRequestSchema } from "@/src/schemas/task-schema";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Attaches a bot's open task in a workspace to a workspace-wide task there,
 * so the manager of the work sees who took which piece (`linkSubtask`): what
 * a bot does with `update_task`'s `parent_task_id`, and what a crew manager
 * has a picker for. Both ends are reached-checked, since the id alone would
 * let someone join another crew's task. Returns the task as it is now.
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
            throw new AppError(`Only an admin can make a task a subtask of another.`);
        }

        const { task_id, parent_task_id } = parseWithSchema({ schema: LinkSubtaskRequestSchema, data: body });

        await assertUserReachesTask({ user_id: user.id, task_id });
        await assertUserReachesTask({ user_id: user.id, task_id: parent_task_id });

        return {
            success: true,
            singleRes: await linkSubtask({
                user_id: user.id,
                task_id,
                parent_task_id,
                by_name: user.first_name || user.username || "The user",
            }),
            msg: `It's a subtask of task #${parent_task_id} now.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};