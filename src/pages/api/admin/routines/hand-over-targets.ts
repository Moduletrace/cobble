import userAuth from "@/src/functions/backend/auth/user-auth";
import grabHandOverTargets from "@/src/functions/backend/db/bots/grab-hand-over-targets";
import grabUserCronJob from "@/src/functions/backend/db/cron-jobs/grab-user-cron-job";
import { CronJobIdRequestSchema } from "@/src/schemas/cron-job-schema";
import type { HandOverTarget } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Who one of the user's routines can be handed to: the other bots where
 * it runs. Loaded when the picker opens.
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

        const { cron_job_id } = parseWithSchema({ schema: CronJobIdRequestSchema, data: body });
        const cron_job = await grabUserCronJob({ user_id: user.id, cron_job_id });

        return {
            success: true,
            payload: await grabHandOverTargets({
                user_id: user.id,
                workspace_id: cron_job.workspace_id || null,
                except_bot_id: cron_job.bot_id || null,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
