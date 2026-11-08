import grabHasUsers from "@/src/functions/backend/auth/grab-has-users";
import { grabDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { BootstrapStatus } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * What the first-run page polls while a restore it started runs: whether
 * the app restarted (`boot_id`), whether accounts exist yet, and while
 * none do, how the restore stands. Public, like the setup page.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BootstrapStatus>
> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const run = grabDataBackupRun();
        const has_users = await grabHasUsers();

        return {
            success: true,
            singleRes: has_users
                ? { has_users, boot_id: run.boot_id, status: "idle" }
                : {
                      has_users,
                      boot_id: run.boot_id,
                      status: run.status,
                      error: run.error,
                  },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
