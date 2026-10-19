import userAuth from "@/src/functions/backend/auth/user-auth";
import updateWorkspace from "@/src/functions/backend/db/workspaces/update-workspace";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import { UpdateWorkspaceRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Saves one of the session user's workspaces: its name, description and
 * the context every bot working there gets. Returns the workspace.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BUN_SQLITE_COBBLE_WORKSPACES>> = async ({ req, body }) => {
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

        const { workspace_id, name, description, system_prompt, archived } = parseWithSchema({ schema: UpdateWorkspaceRequestSchema, data: body });

        await updateWorkspace({
            user_id: user.id,
            workspace_id,
            data: {
                name,
                description,
                system_prompt,
                archived: archived === undefined ? undefined : archived ? 1 : 0,
            },
        });

        return {
            success: true,
            msg: `Saved.`,
            singleRes: (await grabUserWorkspace({ workspace_id, user_id: user.id })) || undefined,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
