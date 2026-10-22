import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteDataBackup from "@/src/functions/backend/backups/delete-data-backup";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Deletes one whole-data archive.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    const backup_name = (body as ApiReqParams | undefined)?.backup_name;

    try {
        deleteDataBackup({ backup_name });

        await logEvent({
            title: "Data backup deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted data archive ${backup_name}.`,
            metadata: { backup_name },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Data backup deletion failed",
            error,
            user_id: user.id,
            metadata: { backup_name },
            ip_address: grabRequestIP(req),
        });

        return {
            success: false,
            msg: error.message,
        };
    }
};
