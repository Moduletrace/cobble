import userAuth from "@/src/functions/backend/auth/user-auth";
import grabTraceMessage from "@/src/functions/backend/db/bot-sessions/grab-trace-message";
import grabMessageTraces from "@/src/functions/backend/db/bots-queue/grab-message-traces";
import grabChatroomMessage from "@/src/functions/backend/db/chatrooms/grab-chatroom-message";
import { BotMessageTraceRequestSchema } from "@/src/schemas/bot-trace-schema";
import type { BotTraceJob } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * What the run behind one message did, in detail: the debug logs tab of
 * that message's Details modal. Read when the tab is opened rather than
 * with the details, since a long run's tool answers are the biggest thing
 * the modal would carry. The conversation's own user reads it, a super
 * admin reads any, and a message posted in a chatroom is checked against
 * the room.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotTraceJob[]>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { message_id, chatroom_id } = parseWithSchema({
            schema: BotMessageTraceRequestSchema,
            data: body,
        });

        const message = chatroom_id
            ? await grabChatroomMessage({ message_id, user_id: Number(user.id) })
            : await grabTraceMessage({
                  message_id,
                  user_id: Number(user.id),
                  user_types,
              });

        if (!message?.id) throw new AppError(`Message not found.`);

        return { success: true, singleRes: await grabMessageTraces({ message_id: Number(message.id) }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};