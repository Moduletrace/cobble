import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";
import type { DataBackup } from "@/src/types";
import dayjs from "dayjs";

type Params = {
    backup: DataBackup;
};

export default async function deleteDataBackup({ backup }: Params) {
    const confirm_msg = `Delete the data archive of ${dayjs(backup.created_at).format("MMM D, YYYY HH:mm:ss")}?\n\nThis removes the file for good.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    const res = await adminFetchHandler({
        url: "/api/admin/backups/delete-data",
        method: "POST",
        body: {
            backup_name: backup.name,
        },
    });

    return {
        success: Boolean(res.success),
        msg: res.success ? undefined : res.msg || `Couldn't delete archive`,
    };
}
