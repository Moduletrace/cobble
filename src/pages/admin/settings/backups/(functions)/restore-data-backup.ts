import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";
import type { DataBackup, DataBackupRun } from "@/src/types";
import dayjs from "dayjs";

type Params = {
    backup: DataBackup;
};

/**
 * Starts replacing the whole data volume with the archive. The server
 * takes a safety archive first and restarts afterwards, all in the
 * background, so this hands back the run for the page to follow.
 */
export default async function restoreDataBackup({ backup }: Params) {
    const confirm_msg = `Restore the data volume from the archive of ${dayjs(backup.created_at).format("MMM D, YYYY HH:mm:ss")}?\n\nEvery bot, workspace, computer home, file, media item and database snapshot is replaced by the archive's, and the app restarts. A safety archive of the current data is made first.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    const res = await adminFetchHandler({
        url: "/api/admin/backups/restore-data",
        method: "POST",
        body: {
            backup_name: backup.name,
        },
    });

    return {
        success: Boolean(res.success),
        msg: res.success ? undefined : res.msg || `Couldn't restore archive`,
        run: res.success ? (res.singleRes as DataBackupRun | undefined) : undefined,
    };
}
