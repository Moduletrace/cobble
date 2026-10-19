import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import type { BotWithLastMessage } from "@/src/types";
import { WorkspaceIdRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * The crew's workers that aren't in a workspace yet, for the workspace
 * rail's "+". Super admins and admins only.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotWithLastMessage>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only admins add bots to workspaces.`);
        }

        const { workspace_id } = parseWithSchema({ schema: WorkspaceIdRequestSchema, data: body });

        const workspace = await grabUserWorkspace({ workspace_id, user_id: user.id });

        if (!workspace?.id) {
            throw new AppError(`Workspace not found.`);
        }

        const [bots, members] = await Promise.all([
            grabBots({ user_id: user.id }),
            grabWorkspaceBots({ user_id: user.id, workspace_id }),
        ]);

        return {
            success: true,
            payload: bots.filter(
                (bot) => bot.kind != "coordinator" && !members.some((member) => member.id == bot.id),
            ),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
