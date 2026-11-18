import userAuth from "@/src/functions/backend/auth/user-auth";
import checkHostDirectory from "@/src/functions/backend/db/host-directories/check-host-directory";
import { CheckHostDirectoryRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { HostDirectoryCheck } from "@/src/types";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Checks a host directory on one computer: whether the folder is still
 * there, and whether each bot working there can read and write in it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<HostDirectoryCheck>> = async ({ req, body }) => {
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

        const data = parseWithSchema({ schema: CheckHostDirectoryRequestSchema, data: body });

        const check = await checkHostDirectory({
            user_id: user.id,
            host_directory_id: data.host_directory_id,
            computer_id: data.computer_id,
        });

        return { success: true, msg: `Checked.`, singleRes: check };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
