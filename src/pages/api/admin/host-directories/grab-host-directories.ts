import userAuth from "@/src/functions/backend/auth/user-auth";
import grabHostDirectories from "@/src/functions/backend/db/host-directories/grab-host-directories";
import assertHostDirectoryManager from "@/src/functions/backend/db/host-directories/assert-host-directory-manager";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { HostDirectoryWithLinks } from "@/src/types";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Every host directory with its links and last checks, for Settings > Host
 * directories after one is added, linked or checked.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<HostDirectoryWithLinks>> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        await assertHostDirectoryManager({ user_id: user.id });

        return { success: true, payload: await grabHostDirectories() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
