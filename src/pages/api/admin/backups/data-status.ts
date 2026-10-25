import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabDataBackups from "@/src/functions/backend/backups/grab-data-backups";
import { grabDataBackupRun } from "@/src/functions/backend/backups/data-backup-run";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { DataBackupStatus } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * How the whole-data archive or restore this process started is going,
 * with the archives as they stand, for the backups page to poll.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<DataBackupStatus>
> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            return {
                success: false,
                msg: `Unauthorized`,
            };
        }

        return {
            success: true,
            singleRes: {
                run: grabDataBackupRun(),
                data_backups: grabDataBackups(),
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
