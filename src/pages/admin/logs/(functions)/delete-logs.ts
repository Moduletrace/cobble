import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";

type Params = {
    ids: number[];
};

export default async function deleteLogs({ ids }: Params) {
    if (!ids[0]) {
        return { success: false, msg: `No logs selected` };
    }

    const confirm_msg =
        ids.length == 1
            ? `Delete this log? This cannot be undone.`
            : `Delete ${ids.length} logs? This cannot be undone.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    /**
     * `operator: "OR"` expands to `(id = ? OR id = ? ...)`. An array with
     * `equality: "IN"` generates invalid SQL in bun-sqlite.
     */
    const res = await adminCrudHandler({
        action: "delete",
        table: "logs",
        sql_query: {
            query: {
                id: {
                    value: ids,
                    operator: "OR",
                },
            },
        },
    });

    return {
        success: Boolean(res.success),
        msg: res.success ? undefined : res.msg || `Couldn't delete logs`,
    };
}
