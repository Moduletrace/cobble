import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";
import type { DataBackupRun, DbBackup } from "@/src/types";
import dayjs from "dayjs";

type Params = {
    backup: DbBackup;
};

/**
 * Starts restoring a snapshot. The server restores it in the background
 * and restarts, so this hands back the run for the page to follow.
 */
export default async function restoreBackup({ backup }: Params) {
    const confirm_msg = `Restore the database from the backup of ${dayjs(backup.created_at).format("MMM D, YYYY HH:mm:ss")}?\n\nAll current data will be replaced with the data in this backup, and the app restarts. A snapshot of the current database is taken first.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    const res = await adminFetchHandler({
        url: "/api/admin/backups/restore",
        method: "POST",
        body: {
            backup_name: backup.name,
        },
    });

    return {
        success: Boolean(res.success),
        msg: res.success ? undefined : res.msg || `Couldn't restore backup`,
        run: res.success ? (res.singleRes as DataBackupRun | undefined) : undefined,
    };
}
