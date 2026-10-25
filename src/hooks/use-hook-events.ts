import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS } from "@/db/types/db";

type Params = {
    hook_id: number;
};

/**
 * One hook's latest calls, loaded when the view showing them opens.
 */
export default function useHookEvents({ hook_id }: Params) {
    const [events, setEvents] = useState<BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let live = true;

        setLoading(true);
        setError(undefined);

        fetchApi<{}, APIResponseObject<BUN_SQLITE_COBBLE_BOT_HOOK_EVENTS>>(
            `/api/admin/hooks/hook-events?hook_id=${hook_id}`,
            { method: "GET" },
        )
            .catch(() => null)
            .then((res) => {
                if (!live) return;

                setLoading(false);

                if (!res?.success) {
                    setError(res?.msg || `Couldn't load the calls.`);
                    return;
                }

                setEvents(res.payload || []);
            });

        return () => {
            live = false;
        };
    }, [hook_id]);

    return { events, loading, error };
}
