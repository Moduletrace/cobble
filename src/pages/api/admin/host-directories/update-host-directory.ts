import userAuth from "@/src/functions/backend/auth/user-auth";
import updateHostDirectory from "@/src/functions/backend/db/host-directories/update-host-directory";
import logEvent from "@/src/functions/backend/logger";
import { UpdateHostDirectoryRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import grabDirNames from "@/src/utils/grab-dir-names";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES } from "@/db/types/db";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Renames a host directory, or points it at another folder on the host.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BUN_SQLITE_COBBLE_HOST_DIRECTORIES>> = async ({ req, body }) => {
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

        const data = parseWithSchema({ schema: UpdateHostDirectoryRequestSchema, data: body });
        const { DATA_DIR } = grabDirNames();

        const directory = await updateHostDirectory({
            user_id: user.id,
            host_directory_id: data.host_directory_id,
            name: data.name,
            source: data.source,
            reserved: [DATA_DIR],
        });

        await logEvent({
            title: `Host directory changed`,
            category: "system",
            user_id: user.id,
            plain_text: `${directory.name} now points at ${directory.source}.`,
            metadata: { host_directory_id: directory.id },
        }).catch(() => {});

        return { success: true, msg: `${directory.name} was saved.`, singleRes: directory };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
