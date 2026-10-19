import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBotMessage from "@/src/functions/backend/db/bots/grab-user-bot-message";
import toggleMessageReaction from "@/src/functions/backend/db/bots/toggle-message-reaction";
import pushToSessionUser from "@/src/bots-queue/push-to-session-user";
import { ReactToBotMessageRequestSchema } from "@/src/schemas/bot-schema";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";

/**
 * Adds or takes back one of the fixed emoji reactions on a bot message in
 * the session user's own conversation, and pushes the message's fresh
 * reactions to their other open tabs.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, body }) => {
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

        const { message_id, emoji } = parseWithSchema({
            schema: ReactToBotMessageRequestSchema,
            data: body,
        });

        const message = await grabUserBotMessage({ user_id: user.id, message_id });

        if (message.author == "user") {
            throw new AppError(`You can only react to the bot's messages.`);
        }

        const reactions = await toggleMessageReaction({
            message_id: Number(message.id),
            user_id: user.id,
            emoji,
        });

        await pushToSessionUser({
            session_id: message.session_id,
            data: {
                event: "server:bot-reaction",
                data: { message_id: Number(message.id), reactions },
            },
        });

        return {
            success: true,
            singleRes: { message_id: Number(message.id), reactions },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
