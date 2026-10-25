import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import restoreDataBackup from "@/src/functions/backend/backups/restore-data-backup";
import { startDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import restartApp from "@/src/functions/backend/backups/restart-app";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { ApiReqParams, DataBackupRun } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Starts replacing the whole data volume with a saved archive and answers
 * at once. Once it is in, the app restarts so it opens the restored
 * database; the page polls `data-status` until it is back.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<DataBackupRun>
> = async ({ req, body }) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    const backup_name = (body as ApiReqParams | undefined)?.backup_name;
    const ip_address = grabRequestIP(req);

    try {
        const run = startDataBackupRun({
            kind: "restore",
            task: async () => {
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
                        ip_address,
                    });

                    restartApp();

                    return result.restored_name;
                } catch (error: any) {
                    await logError({
                        title: "Data restore failed",
                        error,
                        user_id: user.id,
                        metadata: {
                            backup_name,
                        },
                        ip_address,
                    });

                    throw error;
                }
            },
        });

        return {
            success: true,
            singleRes: run,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
