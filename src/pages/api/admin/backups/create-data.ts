import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import createDataBackup from "@/src/functions/backend/backups/create-data-backup";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Archives the whole `DATA_DIR` (Settings > Backups > Data archives).
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
}) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    try {
        const backup = await createDataBackup();

        await logEvent({
            title: "Data backup created",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} created a data backup (${backup.name}).`,
            metadata: { backup_name: backup.name },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Data backup failed",
            error,
            user_id: user.id,
            ip_address: grabRequestIP(req),
        });

        return {
            success: false,
            msg: error.message,
        };
    }
};
