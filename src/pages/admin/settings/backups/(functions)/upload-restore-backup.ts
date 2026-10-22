type Params = {
    file: File;
};

/**
 * Sends the file as multipart form data (not base64 JSON) so large dumps
 * aren't inflated. The server saves it into the snapshots list, then
 * restores it.
 */
export default async function uploadRestoreBackup({ file }: Params) {
    const confirm_msg = `Restore the database from "${file.name}"?\n\nAll current data will be replaced with the data in this file. This cannot be undone. Consider creating a fresh backup first.`;

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
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message || `Couldn't restore backup`,
        };
    }
}
