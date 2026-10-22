type Params = {
    file: File;
};

/**
 * Sends the file as multipart form data (not base64 JSON) so large archives
 * aren't inflated. The app replaces the data volume and restarts, so the
 * caller reloads the page once it is back.
 */
export default async function uploadRestoreDataBackup({ file }: Params) {
    const confirm_msg = `Restore the data volume from "${file.name}"?\n\nEvery bot, workspace, computer home, file, media item and database snapshot is replaced by the archive's, and the app restarts. A safety archive of the current data is made first.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    try {
        const form_data = new FormData();
        form_data.append("file", file);

        const res = await fetch("/api/admin/backups/upload-restore-data", {
            method: "POST",
            body: form_data,
        });

        const json = await res.json();

        return {
            success: Boolean(json.success),
            msg: json.success ? undefined : json.msg || `Couldn't restore archive`,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message || `Couldn't restore archive`,
        };
    }
}
