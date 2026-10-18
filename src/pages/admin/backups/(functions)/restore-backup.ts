import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";
import type { DbBackup } from "@/src/types";
import dayjs from "dayjs";

type Params = {
    backup: DbBackup;
};

export default async function restoreBackup({ backup }: Params) {
    const confirm_msg = `Restore the database from the backup of ${dayjs(backup.created_at).format("MMM D, YYYY HH:mm:ss")}?\n\nAll current data will be replaced with the data in this backup. This cannot be undone. Consider creating a fresh backup first.`;

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
    };
}
