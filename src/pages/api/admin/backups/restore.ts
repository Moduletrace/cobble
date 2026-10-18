import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import restoreDbBackup from "@/src/functions/backend/backups/restore-db-backup";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

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
        await restoreDbBackup({ backup_name });

        /**
         * Logged after the restore so the entry lands in the restored
         * `logs` table.
         */
        await logEvent({
            title: "Database restored",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} restored the database from backup ${backup_name}.`,
            metadata: {
                backup_name,
            },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Database restore failed",
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
