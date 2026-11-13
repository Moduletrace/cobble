import { AppData } from "@/src/data/app-data";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabChatroomMessage from "@/src/functions/backend/db/chatrooms/grab-chatroom-message";
import grabMessageDetails from "@/src/functions/backend/db/usage/grab-message-details";
import { MessageDetailsRequestSchema } from "@/src/schemas/bot-schema";
import type { MessageDetails } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?message_id=`: how a message posted in one of the user's chatrooms
 * was generated (the job, every model call with its provider and model,
 * and the tokens and cost). Loaded when its details modal opens, so the
 * room's messages stay small. `&full=1` lists every call and failure, for
 * the copy of the report.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<MessageDetails>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { message_id, full } = parseWithSchema({ schema: MessageDetailsRequestSchema, data: query });
        const message = await grabChatroomMessage({ message_id, user_id: Number(user.id) });

        if (!message) {
            return { success: false, msg: `Not found` };
        }

        return {
            success: true,
            singleRes: await grabMessageDetails({
                message_id: message.id,
                created_at: message.created_at || null,
                ...(full ? { max_calls: AppData.MessageDetailsCopyMaxCalls } : {}),
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};