import type { DataBackupRun } from "@/src/types";

type Params = {
    file: File;
};

/**
 * Sends the backup a new install starts from as multipart form data (not
 * base64 JSON), so a large archive isn't inflated. The server restores it
 * in the background and restarts, so this hands back the run for the page
 * to follow.
 */
export default async function uploadBootstrapRestore({ file }: Params) {
    const confirm_msg = `Set this install up from "${file.name}"?\n\nIts accounts, bots, workspaces and settings become this install's, and the app restarts. You then log in with an account from the backup.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    try {
        const form_data = new FormData();
        form_data.append("file", file);

        const res = await fetch("/api/auth/bootstrap-restore", {
            method: "POST",
            body: form_data,
        });

        const json = await res.json();

        return {
            success: Boolean(json.success),
            msg: json.success ? undefined : json.msg || `Couldn't restore the backup`,
            run: json.success ? (json.singleRes as DataBackupRun | undefined) : undefined,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message || `Couldn't restore the backup`,
        };
    }
}
