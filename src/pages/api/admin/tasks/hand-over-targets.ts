import userAuth from "@/src/functions/backend/auth/user-auth";
import grabHandOverTargets from "@/src/functions/backend/db/bots/grab-hand-over-targets";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import { TaskIdRequestSchema } from "@/src/schemas/task-schema";
import type { HandOverTarget } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Who a task can be handed to: the bots in its workspace for a workspace's
 * task, else the bots the user chats with. Loaded when the picker opens.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<HandOverTarget>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { task_id } = parseWithSchema({ schema: TaskIdRequestSchema, data: body });
        const task = await assertUserReachesTask({ user_id: user.id, task_id });

        return {
            success: true,
            payload: await grabHandOverTargets({
                user_id: user.id,
                workspace_id: task.workspace_id || null,
                except_bot_id: task.bot_id || null,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
