import userAuth from "@/src/functions/backend/auth/user-auth";
import createHostDirectory from "@/src/functions/backend/db/host-directories/create-host-directory";
import logEvent from "@/src/functions/backend/logger";
import { CreateHostDirectoryRequestSchema } from "@/src/schemas/host-directory-schema";
import AppError from "@/src/utils/app-error";
import grabDirNames from "@/src/utils/grab-dir-names";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES } from "@/db/types/db";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Adds a folder on the host machine (Settings > Host directories). Nothing
 * is mounted until it is linked to a computer or a workspace.
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

        const { name, source } = parseWithSchema({ schema: CreateHostDirectoryRequestSchema, data: body });
        const { DATA_DIR } = grabDirNames();

        const directory = await createHostDirectory({
            user_id: user.id,
            name,
            source,
            reserved: [DATA_DIR],
        });

        await logEvent({
            title: `Host directory added`,
            category: "system",
            user_id: user.id,
            plain_text: `${user.email || user.username || `User #${user.id}`} added ${directory.source} as ${directory.name}.`,
            metadata: { host_directory_id: directory.id },
        }).catch(() => {});

        return { success: true, msg: `${directory.name} was added.`, singleRes: directory };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
