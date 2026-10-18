import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import insertUserMessage from "@/src/functions/backend/db/bots/insert-user-message";
import { SendBotMessageRequestSchema } from "@/src/schemas/bot-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Posts a message from the session user to one of their own bots.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return {
                success: false,
                msg: `Unauthorized`,
                logoutUser: true,
            };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { bot_id, text } = parseWithSchema({
            schema: SendBotMessageRequestSchema,
            data: body,
        });

        const bot = await grabUserBot({ bot_id, user_id: user.id });

        if (!bot?.id) {
            throw new AppError(`Bot not found`);
        }

        const message = await insertUserMessage({ bot_id: bot.id, text });

        return {
            success: true,
            singleRes: message,
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
