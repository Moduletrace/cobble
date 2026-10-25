import pushBotUpdated from "@/src/bots-queue/push-bot-updated";
import userAuth from "@/src/functions/backend/auth/user-auth";
import removeBotType from "@/src/functions/backend/db/bot-types/remove-bot-type";
import setBotType from "@/src/functions/backend/db/bot-types/set-bot-type";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import { SetBotTypeRequestSchema } from "@/src/schemas/bot-type-schema";
import type { WorkspaceBot } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Makes a bot the admin of a workspace it works in, or takes that away
 * (super admins and admins, `BotTypeAssignmentMatrix`). Returns the
 * workspace's crew, and pushes the change to everyone who sees the bot.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<WorkspaceBot>> = async ({ req, body }) => {
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

        const { bot_id, workspace_id, bot_type, given } = parseWithSchema({
            schema: SetBotTypeRequestSchema,
            data: body,
        });

        const change = { user_id: user.id, bot_id, workspace_id, bot_type };

        if (given) await setBotType(change);
        else await removeBotType(change);

        /**
         * Every open crew list shows or drops its shield.
         */
        await pushBotUpdated({ bot_id });

        return {
            success: true,
            payload: await grabWorkspaceBots({ user_id: user.id, workspace_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
