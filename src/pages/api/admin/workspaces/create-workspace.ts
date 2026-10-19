import userAuth from "@/src/functions/backend/auth/user-auth";
import createWorkspace from "@/src/functions/backend/db/workspaces/create-workspace";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { CreateWorkspaceRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Creates a workspace for the session user. Returns its id.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ workspace_id: number }>> = async ({ req, body }) => {
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

        const { name, description, system_prompt } = parseWithSchema({ schema: CreateWorkspaceRequestSchema, data: body });

        const workspace_id = Number(
            await createWorkspace({ user_id: user.id, name, description, system_prompt }),
        );

        await logEvent({
            title: "Workspace created",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} created the workspace ${name}.`,
            metadata: { workspace_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `${name} is ready.`, singleRes: { workspace_id } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
