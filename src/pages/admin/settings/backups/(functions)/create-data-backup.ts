import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";
import type { DataBackupRun } from "@/src/types";

/**
 * Starts the archive, which runs in the background on the server, and
 * hands back its run for the page to follow.
 */
export default async function createDataBackup() {
    if (
        !window.confirm(
            `Archive all of the data volume now? It can take a while on a busy install.`,
        )
    ) {
        return { success: false, cancelled: true };
    }

    const res = await adminFetchHandler({
        url: "/api/admin/backups/create-data",
        method: "POST",
    });

    return {
        success: Boolean(res.success),
        msg: res.success ? undefined : res.msg || `Couldn't create archive`,
        run: res.success ? (res.singleRes as DataBackupRun | undefined) : undefined,
    };
}
