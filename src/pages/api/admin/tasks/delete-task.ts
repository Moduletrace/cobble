import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import deleteTask from "@/src/functions/backend/db/tasks/delete-task";
import { DeleteTaskRequestSchema } from "@/src/schemas/task-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Deletes one of the user's tasks with its notes and file links. The
 * files themselves stay where they live.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, body }) => {
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

        const { task_id } = parseWithSchema({ schema: DeleteTaskRequestSchema, data: body });

        await assertUserReachesTask({ user_id: user.id, task_id });
        await deleteTask({ user_id: user.id, task_id });

        return { success: true, msg: `Task deleted.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
