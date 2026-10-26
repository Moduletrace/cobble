import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBotSession from "@/src/functions/backend/db/bot-sessions/grab-user-bot-session";
import grabBotMessages from "@/src/functions/backend/db/bots/grab-bot-messages";
import { AppData } from "@/src/data/app-data";
import { OlderBotMessagesRequestSchema } from "@/src/schemas/bot-schema";
import type { OlderBotMessagesData } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * The messages before `before_id` (or the latest) in one of the session
 * user's own sessions, `AppData.ConversationOlderMessages` at a time, for
 * the thread scrolled to its top or opening the previous session above
 * it. Reading an old session never puts it in the bot's prompt.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<OlderBotMessagesData>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { session_id, before_id } = parseWithSchema({
            schema: OlderBotMessagesRequestSchema,
            data: body,
        });

        const session = await grabUserBotSession({ session_id, user_id: user.id });

        if (!session?.id) {
            throw new AppError(`Session not found.`);
        }

        const messages = await grabBotMessages({
            session_id: session.id,
            before_id,
            limit: AppData.ConversationOlderMessages + 1,
            user_id: user.id,
        });
        const has_more = messages.length > AppData.ConversationOlderMessages;

        return {
            success: true,
            singleRes: {
                messages: has_more ? messages.slice(1) : messages,
                has_more,
                session: {
                    id: Number(session.id),
                    title: session.title || null,
                    previous_session_id: session.previous_session_id
                        ? Number(session.previous_session_id)
                        : null,
                },
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
