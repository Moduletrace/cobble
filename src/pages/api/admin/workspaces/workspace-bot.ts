import userAuth from "@/src/functions/backend/auth/user-auth";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import { WorkspaceBotRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { WorkspaceBotInstructions } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * A bot's instructions and memory for one workspace, for the editor in its
 * conversation there, which loads them when it opens (page props leave
 * them out). For super admins and admins; only the super admin reaches
 * the coordinator.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<WorkspaceBotInstructions>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only an admin can do that.`);
        }

        const { workspace_id, bot_id } = parseWithSchema({ schema: WorkspaceBotRequestSchema, data: body });
        const bot = (await grabWorkspaceBots({ user_id: user.id, workspace_id })).find(
            (member) => member.id == bot_id,
        );

        if (!bot?.id) {
            throw new AppError(`That bot isn't in this workspace.`);
        }

        return {
            success: true,
            singleRes: {
                system_prompt: bot.workspace_system_prompt || "",
                memory: bot.workspace_memory || "",
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
