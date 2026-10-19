import userAuth from "@/src/functions/backend/auth/user-auth";
import markBotRead from "@/src/functions/backend/db/bots/mark-bot-read";
import { BotIdRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Clears a bot's unread flag when a message arrives in the conversation
 * the user has open. Only the session user's own bots.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { bot_id } = parseWithSchema({ schema: BotIdRequestSchema, data: body });

        await markBotRead({ bot_id, user_id: user.id });

        return { success: true };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
