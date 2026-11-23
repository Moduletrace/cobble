import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotPlanView from "@/src/functions/backend/db/bot-plans/grab-bot-plan-view";
import enqueuePlanStep from "@/src/functions/backend/db/bot-plans/enqueue-plan-step";
import setBotPlanStatus from "@/src/functions/backend/db/bot-plans/set-bot-plan-status";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import { SetBotPlanStateSchema } from "@/src/schemas/bot-plan-schema";
import type { BotPlanView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The user moved a plan from its card: approved it (or picked it back up),
 * paused it, or ended it. Approving, resuming and Continue wake the bot for
 * the step it stands on, so the plan carries on by itself; pausing and
 * cancelling only stop it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotPlanView>> = async ({ req, body }) => {
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

        const { plan_id, status } = parseWithSchema({ schema: SetBotPlanStateSchema, data: body });

        const { row, started } = await setBotPlanStatus({
            plan_id,
            user_id: user.id,
            status: status as "active" | "paused" | "cancelled",
        });

        const view = await grabBotPlanView({ plan_id: row.id, user_id: user.id });

        await pushBotPlan({ plan_id: row.id, session_id: row.session_id, bot_id: row.bot_id });

        if (started) {
            const job_id = await enqueuePlanStep({ plan_id: row.id });

            if (job_id) wakeBotsQueue();
        }

        return { success: true, singleRes: view };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};