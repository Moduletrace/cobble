import userAuth from "@/src/functions/backend/auth/user-auth";
import deleteHostDirectory from "@/src/functions/backend/db/host-directories/delete-host-directory";
import logEvent from "@/src/functions/backend/logger";
import { HostDirectoryIdRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Deletes a host directory and its links. The folder on the host machine,
 * and what bots put in it, stay.
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

        const { host_directory_id } = parseWithSchema({ schema: HostDirectoryIdRequestSchema, data: body });

        await deleteHostDirectory({ user_id: user.id, host_directory_id });

        await logEvent({
            title: `Host directory deleted`,
            category: "system",
            user_id: user.id,
            plain_text: `Host directory #${host_directory_id} was deleted; its folder on the host machine was left as it was.`,
            metadata: { host_directory_id },
        }).catch(() => {});

        return { success: true, msg: `The host directory was deleted.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
