import userAuth from "@/src/functions/backend/auth/user-auth";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import setWorkspaceUserRole from "@/src/functions/backend/db/workspaces/set-workspace-user-role";
import { SetWorkspaceUserRoleRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

type SavedRole = {
    workspace_id: number;
    user_id: number;
    role: string | null;
};

/**
 * Sets (or clears) who a user is in one workspace, which every bot there
 * reads when it works for them. Crew managers only; an admin never sets a
 * super admin's (`setWorkspaceUserRole` checks). Returns the role as saved.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SavedRole>> = async ({ req, body }) => {
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

        const { workspace_id, user_id, role } = parseWithSchema({ schema: SetWorkspaceUserRoleRequestSchema, data: body });

        const saved = await setWorkspaceUserRole({ actor_user_id: user.id, workspace_id, user_id, role });

        await logEvent({
            title: saved ? "Workspace role set" : "Workspace role cleared",
            category: "auth",
            user_id: user.id,
            plain_text: `User #${user.id} ${saved ? "set" : "cleared"} user #${user_id}'s role in workspace #${workspace_id}.`,
            metadata: { workspace_id, user_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved.`,
            singleRes: { workspace_id, user_id, role: saved },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
