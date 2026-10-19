import userAuth from "@/src/functions/backend/auth/user-auth";
import updateCronJob from "@/src/functions/backend/db/cron-jobs/update-cron-job";
import { UpdateCronJobRequestSchema } from "@/src/schemas/cron-job-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { CronJobWithNames } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Changes one of the session user's routines (a bot's schedule): its
 * name, brief or schedule, or pauses and resumes it. Returns the routine.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<CronJobWithNames>> = async ({ req, body }) => {
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

        const { cron_job_id, ...data } = parseWithSchema({ schema: UpdateCronJobRequestSchema, data: body });

        const cron_job = await updateCronJob({ user_id: user.id, cron_job_id, data });

        return {
            success: true,
            singleRes: cron_job,
            msg:
                data.enabled === undefined
                    ? `Saved.`
                    : data.enabled
                      ? `${cron_job.title} is back on.`
                      : `${cron_job.title} is paused.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
