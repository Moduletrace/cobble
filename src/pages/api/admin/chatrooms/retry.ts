import userAuth from "@/src/functions/backend/auth/user-auth";
import retryChatroom from "@/src/functions/backend/db/chatrooms/retry-chatroom";
import { ChatroomIdRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Tries one of the user's failed or stopped chatrooms again: the room
 * reopens and the coordinator carries on from it. The room's new state
 * goes out live.
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

        const { chatroom_id } = parseWithSchema({ schema: ChatroomIdRequestSchema, data: body });

        const retried = await retryChatroom({ chatroom_id, user_id: user.id });

        return { success: true, msg: retried ? `Trying again.` : `It's already running.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
