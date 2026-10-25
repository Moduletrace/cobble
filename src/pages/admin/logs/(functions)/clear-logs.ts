import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ClearLogsRequest } from "@/src/schemas/log-schema";

type Params = {
    category?: ClearLogsRequest["category"];
    /**
     * The tab's name, for the confirmation.
     */
    title: string;
    count?: number;
};

/**
 * Deletes every log in the open tab, after asking.
 */
export default async function clearLogs({ category, title, count }: Params) {
    const amount = typeof count == "number" ? `${count} ` : "";
    const confirm_msg = category
        ? `Delete all ${amount}${title} logs? This cannot be undone.`
        : `Delete all ${amount}logs? This cannot be undone.`;

    if (!window.confirm(confirm_msg)) {
        return { success: false, cancelled: true };
    }

    const res = await fetchApi<ClearLogsRequest, APIResponseObject<{ deleted: number }>>(
        `/api/admin/logs/clear-logs`,
        { method: "POST", body: { category } },
    );

    return {
        success: Boolean(res?.success),
        msg: res?.success ? undefined : res?.msg || `Couldn't delete logs`,
    };
}
