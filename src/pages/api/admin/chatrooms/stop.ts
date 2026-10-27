import userAuth from "@/src/functions/backend/auth/user-auth";
import stopChatroom from "@/src/functions/backend/db/chatrooms/stop-chatroom";
import { ChatroomIdRequestSchema } from "@/src/schemas/bot-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Stops one of the user's open chatrooms: everything in it that could
 * still run is cancelled and the asking bot is told. The room's new state
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

        const stopped = await stopChatroom({ chatroom_id, user_id: user.id });

        return { success: true, msg: stopped ? `Stopped.` : `Nothing is running.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
