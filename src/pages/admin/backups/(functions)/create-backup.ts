import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";

export default async function createBackup() {
    if (!window.confirm(`Create a new database backup now?`)) {
        return { success: false, cancelled: true };
    }

    const res = await adminFetchHandler({
        url: "/api/admin/backups/create",
        method: "POST",
    });

    return {
        success: Boolean(res.success),
        msg: res.success ? undefined : res.msg || `Couldn't create backup`,
    };
}
