import userAuth from "@/src/functions/backend/auth/user-auth";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import detachTaskFile from "@/src/functions/backend/db/tasks/detach-task-file";
import grabTask from "@/src/functions/backend/db/tasks/grab-task";
import { DetachTaskFileRequestSchema } from "@/src/schemas/task-schema";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Unlinks one file from a task and returns it with the rest.
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

        const { task_id, task_media_id, media_id } = parseWithSchema({
            schema: DetachTaskFileRequestSchema,
            data: body,
        });

        await assertUserReachesTask({ user_id: user.id, task_id });
        await detachTaskFile({ task_id, task_media_id, media_id, user_id: user.id });

        return { success: true, singleRes: await grabTask({ user_id: user.id, task_id }), msg: `File unlinked.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
