import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import restoreDataBackup from "@/src/functions/backend/backups/restore-data-backup";
import restartApp from "@/src/functions/backend/backups/restart-app";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Replaces the whole data volume with a saved archive, then restarts the
 * app so it opens the restored database.
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
        const result = await restoreDataBackup({ backup_name });

        await logEvent({
            title: "Data restored",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} restored the data volume from archive ${result.restored_name} (safety copy ${result.safety_name}). The app restarted.`,
            metadata: {
                backup_name: result.restored_name,
                safety_name: result.safety_name,
            },
            ip_address: grabRequestIP(req),
        });

        restartApp();

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Data restore failed",
            error,
            user_id: user.id,
            metadata: {
                backup_name,
            },
            ip_address: grabRequestIP(req),
        });

        return {
            success: false,
            msg: error.message,
        };
    }
};
