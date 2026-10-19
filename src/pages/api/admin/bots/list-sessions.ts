import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotSessions from "@/src/functions/backend/db/bot-sessions/grab-bot-sessions";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import { ListBotSessionsRequestSchema } from "@/src/schemas/bot-schema";
import type { BotSessionListItem } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * The sessions of one of the session user's conversations, latest first,
 * searched by title, summary or message text.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BotSessionListItem>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { bot_id, workspace_id, query, page } = parseWithSchema({
            schema: ListBotSessionsRequestSchema,
            data: body,
        });

        const conversation = await grabUserConversation({ user_id: user.id, bot_id, workspace_id });

        return {
            success: true,
            payload: await grabBotSessions({
                user_id: user.id,
                bot_id: conversation.bot.id,
                workspace_id: conversation.workspace_id,
                query,
                page,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
