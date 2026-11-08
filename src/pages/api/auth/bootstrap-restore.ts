import grabHasUsers from "@/src/functions/backend/auth/grab-has-users";
import { startDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import { isBackupRunning } from "@/src/functions/backend/backups/with-backup-run-lock";
import saveBootstrapUpload, {
    type BootstrapUpload,
} from "@/src/functions/backend/backups/save-bootstrap-upload";
import restoreBootstrapUpload from "@/src/functions/backend/backups/restore-bootstrap-upload";
import { grabRequestIP, logError } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import rateLimit from "@/src/utils/rate-limit";
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
 * First-run setup's other way in: instead of creating a super admin, a
 * new install takes the database file or whole-data archive of another
 * one (multipart, `file` field). Public like signup and, like signup,
 * refused once any account exists, so it can only ever replace an empty
 * install. The file is saved within the request, the restore runs in the
 * background and the app restarts once it's in; the page polls
 * `bootstrap-status` until it's back and then sends the user to log in
 * with an account from the backup.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<DataBackupRun>
> = async ({ req }) => {
    const ip_address = grabRequestIP(req);
    let file_name: string | undefined;
    let upload: BootstrapUpload | undefined;

    const logFailure = (error: unknown) =>
        logError({
            title: "Restore at setup failed",
            error,
            metadata: { file_name, ...upload },
            ip_address,
        }).catch(() => {});

    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const ip_limit = rateLimit({
            key: `bootstrap-restore:ip:${ip_address || "unknown"}`,
            limit: AppData["PasswordAttemptLimit"],
            window_ms: AppData["RateLimitWindowMinutes"] * 60 * 1000,
        });

        if (!ip_limit.allowed) {
            throw new AppError(`Too many requests. Please try again later.`);
        }

        if (await grabHasUsers()) {
            throw new AppError(`This install has already been set up.`);
        }

        if (isBackupRunning()) {
            throw new AppError(`A restore is already running`);
        }

        const file = (await req.formData()).get("file");

        if (!(file instanceof File)) {
            throw new AppError(`No backup uploaded`);
        }

        file_name = file.name;
        upload = await saveBootstrapUpload({ file });

        const saved = upload;

        const run = startDataBackupRun({
            kind: saved.kind == "database" ? "db_restore" : "restore",
            task: async () => {
                try {
                    return await restoreBootstrapUpload({
                        upload: saved,
                        log_entry: {
                            title: "Install restored at setup",
                            category: "system",
                            plain_text: `First-run setup restored this install from ${saved.kind == "database" ? "database file" : "data archive"} ${file_name} (saved as ${saved.backup_name}). The app restarted.`,
                            metadata: { file_name, ...saved },
                            ip_address,
                        },
                    });
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
            msg: safeErrorMessage({ error, log: false }),
        };
    }
};
