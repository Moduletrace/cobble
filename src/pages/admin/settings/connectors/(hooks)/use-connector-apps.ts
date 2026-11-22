import { useCallback, useEffect, useRef, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ConnectorAppFilter } from "@/src/dict/connector-dict";
import type { ConnectorAppsPayload } from "@/src/types";

type Params = {
    connection_id: number;
};

/**
 * One page of a connection's apps, read from the server as the page or the
 * search changes. The apps are never all in memory: a connection can hold
 * thousands, and the page asks for a slice.
 */
export default function useConnectorApps({ connection_id }: Params) {
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<ConnectorAppFilter>("all");
    const [payload, setPayload] = useState<ConnectorAppsPayload>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();
    const search_timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const request = useRef(0);

    const load = useCallback(
        async ({
            next_page,
            next_query,
            next_filter,
        }: {
            next_page: number;
            next_query: string;
            next_filter: ConnectorAppFilter;
        }) => {
            const ticket = ++request.current;

            setLoading(true);
            setError(undefined);

            const params = new URLSearchParams({
                connection_id: String(connection_id),
                page: String(next_page),
                q: next_query,
                filter: next_filter,
            });
            const res = await fetchApi<Record<string, unknown>, APIResponseObject<ConnectorAppsPayload>>(
                `/api/admin/connectors/apps?${params.toString()}`,
                { method: "GET" },
            );

            if (ticket != request.current) return;

            setLoading(false);

            if (!res.success || !res.singleRes) {
                setError(res.msg || "Couldn't read this connection's apps.");
                return;
            }

            setPayload(res.singleRes);
        },
        [connection_id],
    );

    useEffect(() => {
        void load({ next_page: page, next_query: query, next_filter: filter });
    }, [load, page, query, filter]);

    useEffect(() => () => clearTimeout(search_timer.current), []);

    /**
     * Settles the search after a pause, then starts again from page one.
     */
    const search = (value: string) => {
        clearTimeout(search_timer.current);
        search_timer.current = setTimeout(() => {
            setPage(1);
            setQuery(value.trim());
        }, 300);
    };

    /**
     * Switches the tab: connected, unconnected or all, from page one.
     */
    const selectFilter = (value: ConnectorAppFilter) => {
        setPage(1);
        setFilter(value);
    };

    const refresh = () =>
        load({ next_page: page, next_query: query, next_filter: filter });

    return {
        payload,
        loading,
        error,
        page,
        query,
        filter,
        setPage,
        search,
        selectFilter,
        refresh,
    };
}