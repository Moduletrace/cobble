import userAuth from "@/src/functions/backend/auth/user-auth";
import setHostDirectoryAccess from "@/src/functions/backend/db/host-directories/set-host-directory-access";
import { SetHostDirectoryAccessRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * How one link uses its folder: read and write, or read only.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ host_directory_id: number }>> = async ({ req, body }) => {
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

        const data = parseWithSchema({ schema: SetHostDirectoryAccessRequestSchema, data: body });

        await setHostDirectoryAccess({
            user_id: user.id,
            host_directory_id: data.host_directory_id,
            computer_id: data.computer_id || undefined,
            workspace_id: data.workspace_id || undefined,
            access: data.access as never,
        });

        return { success: true, msg: data.access == "read-only" ? `It is read only there now.` : `It is read and write there now.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
