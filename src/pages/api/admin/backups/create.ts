import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import createDbBackup from "@/src/functions/backend/backups/create-db-backup";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

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
        await createDbBackup();

        await logEvent({
            title: "Database backup created",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} created a database backup.`,
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Database backup failed",
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
