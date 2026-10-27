import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserChatrooms from "@/src/functions/backend/db/chatrooms/grab-user-chatrooms";
import { AppData } from "@/src/data/app-data";
import type { ChatroomSummary } from "@/src/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The user's latest chatrooms for the rail (open ones first) in one place:
 * a workspace's (`?workspace_id=`), else those asked from bots' own chats.
 * Loaded by the rail itself so no page carries them.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ChatroomSummary>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        return {
            success: true,
            payload: await grabUserChatrooms({
                user_id: user.id,
                limit: AppData.ChatroomRailLimit + 1,
                workspace_id: Number(query?.workspace_id) || null,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
