import userAuth from "@/src/functions/backend/auth/user-auth";
import deleteCronJob from "@/src/functions/backend/db/cron-jobs/delete-cron-job";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { CronJobIdRequestSchema } from "@/src/schemas/cron-job-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Deletes one of the session user's routines (a bot's schedule).
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

        const { cron_job_id } = parseWithSchema({ schema: CronJobIdRequestSchema, data: body });

        const cron_job = await deleteCronJob({ user_id: user.id, cron_job_id });

        await logEvent({
            title: "Routine deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the routine "${cron_job.title}" of ${cron_job.bot_name}.`,
            metadata: { cron_job_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `${cron_job.title || "The routine"} is deleted.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
