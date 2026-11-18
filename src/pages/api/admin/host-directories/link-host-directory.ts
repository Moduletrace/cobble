import userAuth from "@/src/functions/backend/auth/user-auth";
import linkHostDirectory from "@/src/functions/backend/db/host-directories/link-host-directory";
import logEvent from "@/src/functions/backend/logger";
import { LinkHostDirectoryRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Mounts a host directory in a computer, or in a workspace (on every
 * computer the workspace is on).
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

        const data = parseWithSchema({ schema: LinkHostDirectoryRequestSchema, data: body });

        await linkHostDirectory({
            user_id: user.id,
            host_directory_id: data.host_directory_id,
            computer_id: data.computer_id || undefined,
            workspace_id: data.workspace_id || undefined,
            access: data.access as never,
        });

        await logEvent({
            title: `Host directory linked`,
            category: "system",
            user_id: user.id,
            plain_text: `Host directory #${data.host_directory_id} was linked ${data.computer_id ? `to computer #${data.computer_id}` : `to workspace #${data.workspace_id}`} ${data.access == "read-only" ? "read only" : "read and write"}.`,
            metadata: { host_directory_id: data.host_directory_id },
        }).catch(() => {});

        return { success: true, msg: `It is mounted there now.` };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
