import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotSuggestionView from "@/src/functions/backend/db/bot-suggestions/grab-bot-suggestion-view";
import { BotSuggestionIdSchema } from "@/src/schemas/bot-suggestion-schema";
import type { BotSuggestionView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?suggestion_id=`: next steps a bot suggested to the session user,
 * as their buttons show them. Nobody else reads them.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotSuggestionView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { suggestion_id } = parseWithSchema({ schema: BotSuggestionIdSchema, data: query });

        return { success: true, singleRes: await grabBotSuggestionView({ suggestion_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};