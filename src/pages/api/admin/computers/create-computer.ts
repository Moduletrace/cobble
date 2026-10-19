import userAuth from "@/src/functions/backend/auth/user-auth";
import createComputer from "@/src/functions/backend/db/computers/create-computer";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import addComputerToWorkspace from "@/src/functions/backend/db/workspaces/add-computer-to-workspace";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import type { ComputerWithStatus } from "@/src/types";
import { CreateComputerRequestSchema } from "@/src/schemas/computer-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Creates a computer for the session user (super admins only: each one
 * is a container on this host), and links it to one of their workspaces
 * when one is given. The container is set up in the background; its
 * state arrives as `server:computer-updated`. Returns the computer.
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

        if (!isPassThroughUser({ user_types })) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { name, description, workspace_id } = parseWithSchema({ schema: CreateComputerRequestSchema, data: body });

        if (workspace_id && !(await grabUserWorkspace({ workspace_id, user_id: user.id }))?.id) {
            throw new AppError(`Workspace not found.`);
        }

        const { computer_id } = await createComputer({ user_id: user.id, name, description });

        if (workspace_id) {
            await addComputerToWorkspace({ user_id: user.id, workspace_id, computer_id });
        }

        await logEvent({
            title: "Computer created",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} created the computer ${name}.`,
            metadata: { computer_id, workspace_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `${name} is being set up. It can take a few minutes the first time.`,
            singleRes: (await grabUserComputers({ computer_id }))[0],
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
