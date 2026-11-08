import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import restoreDbBackup from "@/src/functions/backend/backups/restore-db-backup";
import resolveDbBackupPath from "@/src/functions/backend/backups/resolve-db-backup-path";
import { startDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import queueBootLog from "@/src/functions/backend/backups/queue-boot-log";
import restartApp from "@/src/functions/backend/backups/restart-app";
import { grabRequestIP, logError } from "@/src/functions/backend/logger";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { ApiReqParams, DataBackupRun } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Starts restoring a database snapshot and answers at once. The import
 * swaps in a new database file, which this process can't follow (its
 * handle stays on the old one), so the app restarts once it's in; the
 * page polls `data-status` until it's back. The log entry is written by
 * the next boot, into the restored database.
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
        try {
            resolveDbBackupPath({ backup_name });
        } catch {
            throw new AppError(`Backup not found`);
        }

        const run = startDataBackupRun({
            kind: "db_restore",
            task: async () => {
                try {
                    await restoreDbBackup({ backup_name });

                    queueBootLog({
                        entry: {
                            title: "Database restored",
                            category: "system",
                            user_id: user.id,
                            plain_text: `User #${user.id} restored the database from backup ${backup_name}. The app restarted.`,
                            metadata: { backup_name },
                            ip_address,
                        },
                    });

                    restartApp();

                    return String(backup_name);
                } catch (error: unknown) {
                    await logError({
                        title: "Database restore failed",
                        error,
                        user_id: user.id,
                        metadata: { backup_name },
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
