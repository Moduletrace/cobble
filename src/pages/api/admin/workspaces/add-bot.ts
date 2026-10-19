import userAuth from "@/src/functions/backend/auth/user-auth";
import addBotToWorkspace from "@/src/functions/backend/db/workspaces/add-bot-to-workspace";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import type { WorkspaceBot } from "@/src/types";
import { WorkspaceBotRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Puts one of the session user's bots in one of their workspaces. Returns
 * the workspace's crew.
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

        const { workspace_id, bot_id } = parseWithSchema({ schema: WorkspaceBotRequestSchema, data: body });

        await addBotToWorkspace({ user_id: user.id, workspace_id, bot_id });

        return {
            success: true,
            payload: await grabWorkspaceBots({ user_id: user.id, workspace_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
