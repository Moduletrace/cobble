import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import writeDataBackupArchive from "@/src/functions/backend/backups/write-data-backup-archive";
import { startDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { DataBackupRun } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Starts archiving the whole `DATA_DIR` (Settings > Backups > Data
 * archives) and answers at once: the page polls `data-status` until the
 * archive is written. `startDataBackupRun` holds the backup run lock, so
 * the task calls the unlocked writer.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<DataBackupRun>
> = async ({ req }) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    const ip_address = grabRequestIP(req);

    try {
        const run = startDataBackupRun({
            kind: "archive",
            task: async () => {
                try {
                    const backup = await writeDataBackupArchive();

                    await logEvent({
                        title: "Data backup created",
                        category: "system",
                        user_id: user.id,
                        plain_text: `User #${user.id} created a data backup (${backup.name}).`,
                        metadata: { backup_name: backup.name },
                        ip_address,
                    });

                    return backup.name;
                } catch (error: any) {
                    await logError({
                        title: "Data backup failed",
                        error,
                        user_id: user.id,
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
