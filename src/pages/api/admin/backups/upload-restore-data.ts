import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import restoreDataBackup from "@/src/functions/backend/backups/restore-data-backup";
import { startDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import { isBackupRunning } from "@/src/functions/backend/backups/with-backup-run-lock";
import restartApp from "@/src/functions/backend/backups/restart-app";
import saveUploadedDataBackup from "@/src/functions/backend/backups/save-uploaded-data-backup";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
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
 * Multipart upload (`file` field) of a whole-data archive. The file is
 * saved into the archive directory within the request (its bytes keep the
 * connection busy), then the restore starts in the background and the
 * request answers: the app restarts once it is in, and the page polls
 * `data-status` until it is back.
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
            title: "Data restore from upload failed",
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
            throw new AppError(`No archive uploaded`);
        }

        file_name = file.name;
        backup_name = await saveUploadedDataBackup({ file });

        const saved_name = backup_name;

        const run = startDataBackupRun({
            kind: "restore",
            task: async () => {
                try {
                    const result = await restoreDataBackup({
                        backup_name: saved_name,
                    });

                    await logEvent({
                        title: "Data restored from upload",
                        category: "system",
                        user_id: user.id,
                        plain_text: `User #${user.id} restored the data volume from uploaded archive ${file_name} (saved as ${result.restored_name}, safety copy ${result.safety_name}). The app restarted.`,
                        metadata: {
                            file_name,
                            backup_name: result.restored_name,
                            safety_name: result.safety_name,
                        },
                        ip_address,
                    });

                    restartApp();

                    return result.restored_name;
                } catch (error: any) {
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
            msg: safeErrorMessage({ error, log: false }),
        };
    }
};
