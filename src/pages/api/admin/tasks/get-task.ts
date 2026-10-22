import userAuth from "@/src/functions/backend/auth/user-auth";
import grabTask from "@/src/functions/backend/db/tasks/grab-task";
import type { TaskDetail } from "@/src/types";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * One task with its notes and files: what a row's modal loads when it
 * opens, so the page props stay small.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<TaskDetail>> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const task_id = Number(new URL(req.url).searchParams.get("task_id"));

        if (!task_id) {
            return { success: false, msg: `No task given.` };
        }

        return {
            success: true,
            singleRes: await grabTask({ user_id: user.id, task_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
