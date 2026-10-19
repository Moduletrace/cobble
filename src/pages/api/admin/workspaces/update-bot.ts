import userAuth from "@/src/functions/backend/auth/user-auth";
import updateWorkspaceBot from "@/src/functions/backend/db/workspaces/update-workspace-bot";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import type { WorkspaceBot } from "@/src/types";
import { UpdateWorkspaceBotRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Saves a bot's instructions and memory for one of the session user's
 * workspaces. Returns the workspace's crew.
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

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only an admin can do that.`);
        }

        const { workspace_id, bot_id, system_prompt, memory } = parseWithSchema({ schema: UpdateWorkspaceBotRequestSchema, data: body });

        await updateWorkspaceBot({ user_id: user.id, workspace_id, bot_id, system_prompt, memory });

        return {
            success: true,
            msg: `Saved.`,
            payload: await grabWorkspaceBots({ user_id: user.id, workspace_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
