import userAuth from "@/src/functions/backend/auth/user-auth";
import pushWorkspaceRemoved from "@/src/bots-queue/push-workspace-removed";
import grabWorkspaceAudience from "@/src/functions/backend/db/access/grab-workspace-audience";
import deleteWorkspace from "@/src/functions/backend/db/workspaces/delete-workspace";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { WorkspaceIdRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Deletes one of the session user's workspaces with its conversations.
 * Its bots and computers stay.
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

        const { workspace_id } = parseWithSchema({ schema: WorkspaceIdRequestSchema, data: body });

        /**
         * Read before the delete: its links go with it, so who saw it
         * can't be worked out afterwards.
         */
        const audience = await grabWorkspaceAudience({ workspace_id });

        const workspace = await deleteWorkspace({ user_id: user.id, workspace_id });

        pushWorkspaceRemoved({ workspace_id, user_ids: audience });

        await logEvent({
            title: "Workspace deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the workspace ${workspace.name}.`,
            metadata: { workspace_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `${workspace.name || "The workspace"} is deleted.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
