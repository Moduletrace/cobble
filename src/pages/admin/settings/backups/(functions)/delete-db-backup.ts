import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";
import type { DbBackup } from "@/src/types";
import dayjs from "dayjs";

type Params = {
    backup: DbBackup;
};

export default async function deleteDbBackup({ backup }: Params) {
    const confirm_msg = `Delete the database snapshot of ${dayjs(backup.created_at).format("MMM D, YYYY HH:mm:ss")}?\n\nThis removes the file for good.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    const res = await adminFetchHandler({
        url: "/api/admin/backups/delete-db",
        method: "POST",
        body: {
            backup_name: backup.name,
        },
    });

    return {
        success: Boolean(res.success),
        msg: res.success ? undefined : res.msg || `Couldn't delete snapshot`,
    };
}
