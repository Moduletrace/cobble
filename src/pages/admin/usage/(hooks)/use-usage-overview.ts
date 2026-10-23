import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { UsageOverview } from "@/src/types";

type Params = {
    days: number;
    /**
     * The totals the page already carries, when it covers this period.
     */
    page_usage?: UsageOverview | null;
};

/**
 * The usage totals for one period. The page's own copy is used when it
 * covers that period; another one loads from the API, so switching the
 * range doesn't reload the page.
 */
export default function useUsageOverview({ days, page_usage }: Params) {
    const from_page = Boolean(page_usage && page_usage.window.days == days);
    const [usage, set_usage] = useState<UsageOverview | null>(from_page ? page_usage || null : null);
    const [loading, set_loading] = useState(!from_page);
    const [error, set_error] = useState<string>();

    useEffect(() => {
        if (from_page) {
            set_usage(page_usage || null);
            set_loading(false);
            set_error(undefined);
            return;
        }

        const controller = new AbortController();

        const load = async () => {
            set_loading(true);
            set_error(undefined);

            const res = await fetchApi<{}, APIResponseObject<UsageOverview>>(
                `/api/admin/usage?days=${days}`,
                { method: "GET" },
            ).catch(() => null);

            if (controller.signal.aborted) return;

            set_loading(false);

            if (!res?.success || !res.singleRes) {
                set_usage(null);
                set_error(res?.msg || `Couldn't read the usage.`);
                return;
            }

            set_usage(res.singleRes);
        };

        load().catch(() => {});

        return () => controller.abort();
    }, [days, from_page, page_usage]);

    return { usage, loading, error };
}
