import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotQuestionView from "@/src/functions/backend/db/bot-questions/grab-bot-question-view";
import { BotQuestionIdSchema } from "@/src/schemas/bot-question-schema";
import type { BotQuestionView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?question_id=`: questions a bot asked the session user, as their
 * chip and card show them. Nobody else reads them.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotQuestionView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { question_id } = parseWithSchema({ schema: BotQuestionIdSchema, data: query });

        return { success: true, singleRes: await grabBotQuestionView({ question_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
