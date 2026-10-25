import userAuth from "@/src/functions/backend/auth/user-auth";
import grabSpeakableMessage from "@/src/functions/backend/db/bots/grab-speakable-message";
import grabMessageDetails from "@/src/functions/backend/db/usage/grab-message-details";
import { MessageDetailsRequestSchema } from "@/src/schemas/bot-schema";
import type { MessageDetails } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?message_id=`: how one of the bot's messages in the user's own
 * conversation was generated (the job, every model call with its provider
 * and model, and the tokens and cost). Loaded when its details modal
 * opens, so the thread's messages stay small.
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

        const { message_id } = parseWithSchema({ schema: MessageDetailsRequestSchema, data: query });
        const { message } = await grabSpeakableMessage({ user_id: Number(user.id), message_id });

        return {
            success: true,
            singleRes: await grabMessageDetails({
                message_id: Number(message.id),
                created_at: Number(message.created_at) || null,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
