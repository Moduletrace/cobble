import type { BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import startBotSession from "@/src/functions/backend/db/bot-sessions/start-bot-session";
import { BotConversationRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * New session: closes the active session of one of the session user's
 * conversations and starts a fresh one, linked to nothing and carrying no
 * summary. Carrying the conversation on is `continue-session`.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BUN_SQLITE_COBBLE_BOT_SESSIONS>
> = async ({ req, body }) => {
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

        const { bot_id, workspace_id } = parseWithSchema({
            schema: BotConversationRequestSchema,
            data: body,
        });

        const conversation = await grabUserConversation({ user_id: user.id, bot_id, workspace_id });

        return {
            success: true,
            singleRes: await startBotSession({
                user_id: user.id,
                bot_id: conversation.bot.id,
                workspace_id: conversation.workspace_id,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
