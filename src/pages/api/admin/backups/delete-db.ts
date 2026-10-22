import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteDbBackup from "@/src/functions/backend/backups/delete-db-backup";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Deletes one database snapshot from `db/.backups`.
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
        deleteDbBackup({ backup_name });

        await logEvent({
            title: "Database backup deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted database backup ${backup_name}.`,
            metadata: { backup_name },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Database backup deletion failed",
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
