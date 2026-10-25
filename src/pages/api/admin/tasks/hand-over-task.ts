import userAuth from "@/src/functions/backend/auth/user-auth";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import grabTask from "@/src/functions/backend/db/tasks/grab-task";
import handOverTask from "@/src/functions/backend/db/tasks/hand-over-task";
import { HandOverTaskRequestSchema } from "@/src/schemas/task-schema";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Hands an open task to another bot and starts the work (`handOverTask`):
 * the bot works that same task, and its result lands in its conversation.
 * Crew managers only, like every other change to a task by hand. Returns
 * the task as it is now.
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
            throw new AppError(`Only an admin can hand a task over.`);
        }

        const { task_id, bot_id, instructions } = parseWithSchema({ schema: HandOverTaskRequestSchema, data: body });

        await assertUserReachesTask({ user_id: user.id, task_id });

        const handed = await handOverTask({
            user_id: user.id,
            task_id,
            to_bot_id: bot_id,
            instructions,
            handed_by: user.first_name || user.username || "The user",
        });

        wakeBotsQueue();

        return {
            success: true,
            singleRes: await grabTask({ user_id: user.id, task_id }),
            msg: `${handed.bot_name} has it now and is starting on it.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
