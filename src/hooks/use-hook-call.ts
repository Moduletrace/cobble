import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { BotHookCall } from "@/src/types";

type Params = {
    event_id: number;
    /**
     * Loads only once the call is opened.
     */
    open: boolean;
};

/**
 * One hook call whole (what it sent and what its run answered), loaded
 * the first time it is opened.
 */
export default function useHookCall({ event_id, open }: Params) {
    const [call, setCall] = useState<BotHookCall>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!open || call) return;

        let live = true;

        setLoading(true);
        setError(undefined);

        fetchApi<{}, APIResponseObject<BotHookCall>>(`/api/admin/hooks/hook-event?event_id=${event_id}`, {
            method: "GET",
        })
            .catch(() => null)
            .then((res) => {
                if (!live) return;

                setLoading(false);

                if (!res?.success || !res.singleRes) {
                    setError(res?.msg || `Couldn't load the call.`);
                    return;
                }

                setCall(res.singleRes);
            });

        return () => {
            live = false;
        };
    }, [event_id, open]);

    return { call, loading, error };
}
