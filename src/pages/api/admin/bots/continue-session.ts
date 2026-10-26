import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import userAuth from "@/src/functions/backend/auth/user-auth";
import continueBotSession from "@/src/functions/backend/db/bot-sessions/continue-bot-session";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
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
 * Continue in new session: carries one of the session user's
 * conversations into a new session with a summary of the active one, as
 * the bot does when asked (`continueBotSession`). The active one is closed
 * for good. Unlike `new-session`, which starts fresh.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BUN_SQLITE_COBBLE_BOT_MESSAGES>
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

        const message = await continueBotSession({
            user_id: user.id,
            bot_id: Number(conversation.bot.id),
            workspace_id: conversation.workspace_id ? Number(conversation.workspace_id) : null,
        });

        await pushBotNotice({ bot_id: Number(conversation.bot.id), message, quiet_push: true });

        return { success: true, singleRes: message };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
