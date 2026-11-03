import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import grabTask from "@/src/functions/backend/db/tasks/grab-task";
import makeTaskWorkspaceWide from "@/src/functions/backend/db/tasks/make-task-workspace-wide";
import { TaskIdRequestSchema } from "@/src/schemas/task-schema";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Turns a bot's open task in a workspace into a workspace-wide one, which
 * every bot there works on (`makeTaskWorkspaceWide`). Crew managers only,
 * like every other change to a task by hand. Returns the task as it is now.
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
            throw new AppError(`Only an admin can make a task workspace-wide.`);
        }

        const { task_id } = parseWithSchema({ schema: TaskIdRequestSchema, data: body });

        await assertUserReachesTask({ user_id: user.id, task_id });
        await makeTaskWorkspaceWide({ task_id, by_name: user.first_name || user.username || "The user" });

        return {
            success: true,
            singleRes: await grabTask({ user_id: user.id, task_id }),
            msg: `It's workspace-wide now: every bot in the workspace works on it.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
