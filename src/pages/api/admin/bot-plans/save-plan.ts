import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotPlanView from "@/src/functions/backend/db/bot-plans/grab-bot-plan-view";
import saveBotPlanSteps from "@/src/functions/backend/db/bot-plans/save-bot-plan-steps";
import pushBotPlan from "@/src/bots-queue/push-bot-plan";
import { SaveBotPlanSchema } from "@/src/schemas/bot-plan-schema";
import type { BotPlanView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The user changed a plan's steps on its card, before approving it or while
 * it runs. Steps already done stay as they are: they record work that
 * happened. Answers with the plan as it now stands, and tells the open
 * conversation so every card of it shows the same steps.
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

        const { plan_id, title, goal, steps } = parseWithSchema({ schema: SaveBotPlanSchema, data: body });

        const row = await saveBotPlanSteps({ plan_id, user_id: user.id, title, goal, steps });
        const view = await grabBotPlanView({ plan_id: row.id, user_id: user.id });

        await pushBotPlan({
            plan_id: row.id,
            session_id: row.session_id,
            bot_id: row.bot_id,
        });

        return { success: true, singleRes: view };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};