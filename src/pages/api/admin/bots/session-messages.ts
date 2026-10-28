import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBotSession from "@/src/functions/backend/db/bot-sessions/grab-user-bot-session";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import grabBotFace from "@/src/functions/backend/db/bots/grab-bot-face";
import grabActiveBotTask from "@/src/functions/backend/db/bots/grab-active-bot-task";
import { AppData } from "@/src/data/app-data";
import { BotSessionIdRequestSchema } from "@/src/schemas/bot-schema";
import type { SessionMessagesResponse } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The latest messages of one of the session user's own sessions, and the
 * bot's face, status line and active task for that user (as
 * `server:bot-updated` carries them), so the open conversation can catch
 * up on a reply or a face change whose live push it missed.
 */
export const handler: BunextAPIRouteHandler<SessionMessagesResponse> = async ({ req, body }) => {
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

        const bot_id = Number(session.bot_id);

        return {
            success: true,
            payload: await grabBotMessages({
                session_id: session.id,
                limit: AppData.BotReplyCatchUpMessages,
                user_id: user.id,
            }),
            bot: {
                id: bot_id,
                ...(await grabBotFace({ bot_id, user_id: user.id })),
                task: await grabActiveBotTask({ bot_id, user_id: user.id }),
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
