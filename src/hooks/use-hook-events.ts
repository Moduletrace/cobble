import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import { AppData } from "@/src/data/app-data";
import type { BotHookEventStatus } from "@/src/dict/bot-hook-dict";
import type { BotHookCall } from "@/src/types";

type Params = {
    hook_id: number;
    /**
     * Words to find in what a call sent or what its run answered.
     */
    query?: string;
    status?: BotHookEventStatus | "";
};

function callsUrl({ hook_id, query, status, before_id }: Params & { before_id?: number }) {
    const search = new URLSearchParams({ hook_id: String(hook_id), limit: String(AppData.BotHookCallsPageSize) });

    if (query) search.set("q", query);
    if (status) search.set("status", status);
    if (before_id) search.set("before_id", String(before_id));

    return `/api/admin/hooks/hook-events?${search}`;
}

/**
 * One hook's calls, newest first, loaded when the view showing them opens
 * and again when the search or status changes, a page at a time.
 */
export default function useHookEvents({ hook_id, query = "", status = "" }: Params) {
    const [events, setEvents] = useState<BotHookCall[]>([]);
    const [loading, setLoading] = useState(true);
    const [more, setMore] = useState(false);
    const [error, setError] = useState<string>();

    const load = async ({ before_id }: { before_id?: number }) => {
        setLoading(true);
        setError(undefined);

        const res = await fetchApi<{}, APIResponseObject<BotHookCall>>(
            callsUrl({ hook_id, query, status, before_id }),
            { method: "GET" },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success) {
            setError(res?.msg || `Couldn't load the calls.`);
            return null;
        }

        const page = res.payload || [];

        setMore(page.length >= AppData.BotHookCallsPageSize);

        return page;
    };

    useEffect(() => {
        let live = true;

        setEvents([]);

        load({}).then((page) => {
            if (live && page) setEvents(page);
        });

        return () => {
            live = false;
        };
    }, [hook_id, query, status]);

    const loadOlder = async () => {
        const last = events[events.length - 1];

        if (!last?.id) return;

        const page = await load({ before_id: Number(last.id) });

        if (page) setEvents((current) => [...current, ...page]);
    };

    return { events, loading, error, more, loadOlder };
}
