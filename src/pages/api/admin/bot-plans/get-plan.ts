import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotPlanView from "@/src/functions/backend/db/bot-plans/grab-bot-plan-view";
import { GetBotPlanSchema } from "@/src/schemas/bot-plan-schema";
import type { BotPlanView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?plan_id=`: a plan as its card shows it, for the user it was made
 * for. Nobody else reads it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotPlanView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { plan_id } = parseWithSchema({ schema: GetBotPlanSchema, data: query });

        return { success: true, singleRes: await grabBotPlanView({ plan_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};