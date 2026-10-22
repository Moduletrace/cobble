import adminFetchHandler from "@/src/functions/frontend/admin-fetch-handler";

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
    };
}
