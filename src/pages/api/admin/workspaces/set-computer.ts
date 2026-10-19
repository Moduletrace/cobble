import userAuth from "@/src/functions/backend/auth/user-auth";
import setWorkspaceComputer from "@/src/functions/backend/db/workspaces/set-workspace-computer";
import type { ComputerWithStatus } from "@/src/types";
import { WorkspaceComputerRequestSchema } from "@/src/schemas/workspace-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Makes one of a workspace's computers its default. Returns the
 * workspace's computers, the default first.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ComputerWithStatus>> = async ({ req, body }) => {
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

        const { workspace_id, computer_id } = parseWithSchema({ schema: WorkspaceComputerRequestSchema, data: body });

        const { computer, computers } = await setWorkspaceComputer({
            user_id: user.id,
            workspace_id,
            computer_id,
        });

        return {
            success: true,
            msg: `${computer.name || "That computer"} is the default now.`,
            payload: computers,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
