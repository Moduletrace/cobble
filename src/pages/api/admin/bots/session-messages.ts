import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBotSession from "@/src/functions/backend/db/bot-sessions/grab-user-bot-session";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import { AppData } from "@/src/data/app-data";
import { BotSessionIdRequestSchema } from "@/src/schemas/bot-schema";
import type { BotMessageWithAttachments } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * The latest messages of one of the session user's own sessions, so the
 * open conversation can catch up on a reply whose live push it missed.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BotMessageWithAttachments>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { session_id } = parseWithSchema({ schema: BotSessionIdRequestSchema, data: body });

        const session = await grabUserBotSession({ session_id, user_id: user.id });

        if (!session?.id) {
            throw new AppError(`Session not found.`);
        }

        return {
            success: true,
            payload: await grabBotMessages({
                session_id: session.id,
                limit: AppData.BotReplyCatchUpMessages,
                user_id: user.id,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
