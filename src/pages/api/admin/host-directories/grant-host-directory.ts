import userAuth from "@/src/functions/backend/auth/user-auth";
import applyHostDirectoryGrant, {
    type HostDirectoryGrantResult,
} from "@/src/functions/backend/db/host-directories/apply-host-directory-grant";
import { HostDirectoryIdRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject as ResponseObject,
    BunextAPIRouteHandler as Handler,
} from "@moduletrace/bunext/types";

/**
 * Gives every bot that sees a host directory access to its folder, and
 * takes it from the ones that no longer do. It happens by itself when a
 * link or a bot is added; this is the way back if that failed, and it checks
 * the folder again afterwards.
 */
export const handler: Handler<ResponseObject<HostDirectoryGrantResult>> = async ({
    req,
    body,
}) => {
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

        const data = parseWithSchema({
            schema: HostDirectoryIdRequestSchema,
            data: body,
        });

        const grant = await applyHostDirectoryGrant({
            host_directory_id: data.host_directory_id,
            user_id: user.id,
        });

        if (grant.error) {
            throw new AppError(grant.error);
        }

        return {
            success: true,
            msg: `Every bot that sees it can work in it now.`,
            singleRes: grant,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};