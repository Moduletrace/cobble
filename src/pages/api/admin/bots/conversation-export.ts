import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConversationExport from "@/src/functions/backend/db/bot-sessions/grab-conversation-export";
import { BotConversationRequestSchema } from "@/src/schemas/bot-schema";
import type { ConversationExport } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * The active session of the session user's conversation with a bot, which
 * the header menu's "Copy chat" turns into markdown.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<ConversationExport>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { bot_id, workspace_id } = parseWithSchema({
            schema: BotConversationRequestSchema,
            data: body,
        });

        const user_name =
            [user.first_name, user.last_name].filter(Boolean).join(" ") ||
            user.username ||
            "You";

        const conversation = await grabConversationExport({
            user_id: Number(user.id),
            user_name,
            bot_id,
            workspace_id,
        });

        if (!conversation) {
            throw new AppError(`You can't open this conversation.`);
        }

        return { success: true, singleRes: conversation };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
