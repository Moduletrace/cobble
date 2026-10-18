import { useState, useRef, useEffect } from "react";
import _ from "lodash";
import { AppData } from "../data/app-data";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import adminFetchHandler from "../functions/frontend/admin-fetch-handler";
import type { BUN_SQLITE_BSQLITE_ALL_TYPEDEFS } from "@/db/types/db";
import type { AdminFetchParams, ApiReqParams } from "../types";
import EJSON from "../utils/ejson";

type Params<T extends {} = BUN_SQLITE_BSQLITE_ALL_TYPEDEFS> = Omit<
    AdminFetchParams<T>,
    "method" | "body"
> & {
    debug?: boolean;
    initial_res?: T[];
    count?: boolean;
};

export function useFetchGet<T extends {} = BUN_SQLITE_BSQLITE_ALL_TYPEDEFS>({
    url,
    debug,
    initial_res,
    query: api_query_params,
}: Params<T>) {
    const [res, setRes] = useState<T[] | undefined>(initial_res);
    const [count, setCount] = useState<number | undefined>();
    const [page, setPage] = useState<number>(api_query_params?.page || 1);
    const [limit, setLimit] = useState<number>(AppData["DefaultQueryLimit"]);
    const [query, setQuery] = useState<ApiReqParams<T> | undefined>(
        api_query_params,
    );

    const { ready, setReady } = useStatus();

    const fetching_ref = useRef(true);

    useEffect(() => {
        if (res) return;

        fetching_ref.current = true;

        const final_query = _.merge<ApiReqParams<T>, ApiReqParams<T>>(
            query || {},
            { page },
        );

        if (debug) {
            console.log("final_query", final_query);
        }

        adminFetchHandler<T>({
            url,
            query: final_query,
        })
            .then((result) => {
                if (debug) {
                    console.log("Main result", result);
                }

                setRes(result.payload || []);
                setCount(result?.count);
            })
            .catch((err) => {
                console.log(`Error => ${err.message}`);
                setRes([]);
            })
            .finally(() => {
                if (!ready) {
                    setTimeout(() => {
                        fetching_ref.current = false;
                        setReady(true);
                    }, 1000);
                } else {
                    fetching_ref.current = false;
                }
            });
    }, [res]);

    useEffect(() => {
        if (!ready) return;
        if (fetching_ref.current) return;
        setRes(undefined);
    }, [page]);

    useEffect(() => {
        if (!ready) return;
        if (fetching_ref.current) return;
        if (query) {
            const url = new URL(window.location.href);
            url.searchParams.set("q", EJSON.stringify(query || {}) || "");
            history.pushState(null, "", url);
        }
        setPage(1);
        setRes(undefined);
    }, [query]);

    return {
        res,
        setRes,
        count,
        page,
        setPage,
        query,
        setQuery,
        limit,
        setLimit,
        ready,
        setReady,
    };
}
