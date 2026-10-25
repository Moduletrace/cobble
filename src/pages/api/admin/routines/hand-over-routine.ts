import userAuth from "@/src/functions/backend/auth/user-auth";
import handOverCronJob from "@/src/functions/backend/db/cron-jobs/hand-over-cron-job";
import { HandOverCronJobRequestSchema } from "@/src/schemas/cron-job-schema";
import type { CronJobWithNames } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Hands one of the session user's routines to another of their bots where
 * it runs (`handOverCronJob`). Returns the routine.
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

        const { cron_job_id, bot_id } = parseWithSchema({ schema: HandOverCronJobRequestSchema, data: body });

        const handed = await handOverCronJob({
            user_id: user.id,
            cron_job_id,
            to_bot_id: bot_id,
            handed_by: user.first_name || user.username || "The user",
        });

        return {
            success: true,
            singleRes: handed.cron_job,
            msg: `${handed.bot_name} runs it now.${
                handed.computer_dropped ? ` Its computer isn't one ${handed.bot_name} reaches, so it uses their default.` : ""
            }`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
