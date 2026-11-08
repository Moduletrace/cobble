import type { DataBackupRun } from "@/src/types";

type Params = {
    file: File;
};

/**
 * Sends the file as multipart form data (not base64 JSON) so large dumps
 * aren't inflated. The server saves it into the snapshots list, then
 * restores it in the background and restarts, so this hands back the run
 * for the page to follow.
 */
export default async function uploadRestoreBackup({ file }: Params) {
    const confirm_msg = `Restore the database from "${file.name}"?\n\nAll current data will be replaced with the data in this file, and the app restarts. A snapshot of the current database is taken first.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    try {
        const form_data = new FormData();
        form_data.append("file", file);

        const res = await fetch("/api/admin/backups/upload-restore", {
            method: "POST",
            body: form_data,
        });

        const json = await res.json();

        return {
            success: Boolean(json.success),
            msg: json.success ? undefined : json.msg || `Couldn't restore backup`,
            run: json.success ? (json.singleRes as DataBackupRun | undefined) : undefined,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message || `Couldn't restore backup`,
        };
    }
}
