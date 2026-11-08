import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import saveUploadedDbBackup from "@/src/functions/backend/backups/save-uploaded-db-backup";
import restoreDbBackup from "@/src/functions/backend/backups/restore-db-backup";
import { startDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import { isBackupRunning } from "@/src/functions/backend/backups/with-backup-run-lock";
import queueBootLog from "@/src/functions/backend/backups/queue-boot-log";
import restartApp from "@/src/functions/backend/backups/restart-app";
import { grabRequestIP, logError } from "@/src/functions/backend/logger";
import AppError from "@/src/utils/app-error";
import type { DataBackupRun } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
    BunextServerRouteConfig,
} from "@moduletrace/bunext/types";

export const config: BunextServerRouteConfig = {
    max_request_body_mb: 500,
};

/**
 * Multipart upload (`file` field) of a SQLite database file. The file is
 * saved into the backups directory within the request, then the restore
 * starts in the background and the request answers: the app restarts
 * once it's in (this process's handle stays on the replaced file), and
 * the page polls `data-status` until it's back.
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
    let file_name: string | undefined;
    let backup_name: string | undefined;

    const logFailure = async (error: unknown) => {
        await logError({
            title: "Database restore from upload failed",
            error,
            user_id: user.id,
            metadata: {
                file_name,
                backup_name,
            },
            ip_address,
        });
    };

    try {
        if (isBackupRunning()) {
            throw new AppError(`Another backup or restore is already running`);
        }

        const file = (await req.formData()).get("file");

        if (!(file instanceof File)) {
            throw new AppError(`No backup file uploaded`);
        }

        file_name = file.name;
        backup_name = await saveUploadedDbBackup({ file });

        const saved_name = backup_name;

        const run = startDataBackupRun({
            kind: "db_restore",
            task: async () => {
                try {
                    await restoreDbBackup({ backup_name: saved_name });

                    queueBootLog({
                        entry: {
                            title: "Database restored from upload",
                            category: "system",
                            user_id: user.id,
                            plain_text: `User #${user.id} restored the database from uploaded file ${file_name} (saved as ${saved_name}). The app restarted.`,
                            metadata: {
                                file_name,
                                backup_name: saved_name,
                            },
                            ip_address,
                        },
                    });

                    restartApp();

                    return saved_name;
                } catch (error: unknown) {
                    await logFailure(error);
                    throw error;
                }
            },
        });

        return {
            success: true,
            singleRes: run,
        };
    } catch (error: unknown) {
        if (!(error instanceof AppError)) {
            await logFailure(error);
        }

        return {
            success: false,
            msg: error instanceof Error ? error.message : String(error),
        };
    }
};
