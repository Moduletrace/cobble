import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import ensureBotSession from "@/src/functions/backend/db/bot-sessions/ensure-bot-session";
import insertUserMessage from "@/src/functions/backend/db/bots/insert-user-message";
import grabAttachableMedia from "@/src/functions/backend/db/bots/grab-attachable-media";
import enqueueBotReply from "@/src/functions/backend/db/bots-queue/enqueue-bot-reply";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
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
 * Posts a message from the session user to one of their own bots, in its
 * own chat or in a workspace it's in, and queues the bot's reply, which
 * arrives over the WebSocket. The message goes in the conversation's
 * active session (the next one when it's full) and also to the user's
 * other open tabs. Files are uploaded first (`upload-attachment`) and
 * sent as `media_ids`.
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

        const { bot_id, workspace_id, text, media_ids } = parseWithSchema({
            schema: SendBotMessageRequestSchema,
            data: body,
        });

        const conversation = await grabUserConversation({ user_id: user.id, bot_id, workspace_id });
        const bot = conversation.bot;

        const media = await grabAttachableMedia({ user_id: Number(user.id), media_ids });
        const session = await ensureBotSession({
            bot_id: bot.id,
            workspace_id: conversation.workspace_id,
            rollover: true,
        });

        const message = await insertUserMessage({
            bot_id: bot.id,
            session_id: Number(session.id),
            workspace_id: conversation.workspace_id,
            text,
            media,
        });

        await enqueueBotReply({
            user_id: user.id,
            bot_id: bot.id,
            session_id: Number(session.id),
            message_id: message.id || 0,
        });

        wakeBotsQueue();

        await pushBotNotice({ bot_id: bot.id, message });

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
