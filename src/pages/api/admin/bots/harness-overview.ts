import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import grabConversationHarnessSettings from "@/src/functions/backend/db/harness/grab-conversation-harness-settings";
import { BotConversationRequestSchema } from "@/src/schemas/bot-schema";
import type { BotHarnessSettingsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * What a conversation's models form edits, loaded when it opens: the
 * coordinator's defaults (super admins), or a worker's or the workspace's
 * models (super admins and admins). The install-wide catalog comes from
 * `api/admin/harness/catalog`, so it is cached once rather than per bot.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BotHarnessSettingsPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { bot_id, workspace_id } = parseWithSchema({
            schema: BotConversationRequestSchema,
            data: body,
        });

        const conversation = await grabUserConversation({ user_id: user.id, bot_id, workspace_id });
        const scope = conversation.workspace_id;
        const can_edit =
            conversation.bot.kind == "coordinator" && !scope
                ? isPassThroughUser({ user_types })
                : canManageCrew({ user_types });

        if (!can_edit) {
            throw new AppError(`Only an admin can change these models.`);
        }

        return {
            success: true,
            singleRes: await grabConversationHarnessSettings({
                bot: conversation.bot,
                workspace_id: scope,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
