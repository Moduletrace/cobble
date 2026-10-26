import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConversationHistory from "@/src/functions/backend/db/bot-sessions/grab-conversation-history";
import { ConversationHistoryRequestSchema } from "@/src/schemas/bot-schema";
import type { ConversationHistoryPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * A conversation's history (`grabConversationHistory`: its active session
 * or the one `session_id` names,
 * latest messages and the bot's active task there), which the
 * conversation pages load once they are on screen instead of rendering it
 * on the server, so a page restored by the back button never shows an
 * old thread. When the user can't chat with the bot there any more,
 * `redirect` says where the page goes instead: their bots, or the
 * workspace (its settings for managers).
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<ConversationHistoryPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { bot_id, workspace_id, session_id } = parseWithSchema({
            schema: ConversationHistoryRequestSchema,
            data: body,
        });

        const history = await grabConversationHistory({
            user_id: Number(user.id),
            bot_id,
            workspace_id,
            session_id,
        });

        if (!history) {
            const redirect = !workspace_id
                ? "/admin/bots"
                : canManageCrew({ user_types })
                  ? `/admin/settings/workspaces/${workspace_id}`
                  : `/admin/workspaces/${workspace_id}`;

            return { success: true, singleRes: { redirect } };
        }

        return { success: true, singleRes: { history } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
