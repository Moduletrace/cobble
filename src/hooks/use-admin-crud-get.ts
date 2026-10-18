import { useState, useRef, useEffect } from "react";
import adminCrudHandler from "../functions/frontend/admin-crud-handler";
import _ from "lodash";
import { AppData } from "../data/app-data";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import type { BUN_SQLITE_BSQLITE_ALL_TYPEDEFS } from "@/db/types/db";
import type { ApiReqParams, ClientAdminCrudParams, TableType } from "../types";
import type { ServerQueryParam } from "@moduletrace/bun-sqlite";
import EJSON from "../utils/ejson";

type Params<T extends {} = BUN_SQLITE_BSQLITE_ALL_TYPEDEFS> = Pick<
    ClientAdminCrudParams,
    "id" | "count"
> & {
    table: TableType;
    sql_query?: ServerQueryParam<T>;
    debug?: boolean;
    page?: number;
    limit?: number;
    initial_res?: T[];
    ready?: boolean;
    request_query?: ApiReqParams<T>;
};

export function useAdminCrudGet<T extends {} = BUN_SQLITE_BSQLITE_ALL_TYPEDEFS>({
    table,
    sql_query,
    count: add_count_param,
    debug,
    page: initial_page,
    limit: initial_limit,
    initial_res,
    ready: initial_ready,
    request_query,
    ...args
}: Params<T>) {
    const [res, setRes] = useState<T[] | undefined>(initial_res);
    const [count, setCount] = useState<number | undefined>();
    const [page, setPage] = useState<number>(initial_page || 1);
    const [limit, setLimit] = useState<number>(
        initial_limit || AppData["DefaultQueryLimit"],
    );
    const [query, setQuery] = useState<ServerQueryParam<T> | undefined>(
        sql_query,
    );

    const { ready, setReady } = useStatus();

    const fetching_ref = useRef(true);

    useEffect(() => {
        if (res) return;
        if (typeof initial_ready == "boolean" && !initial_ready) return;

        fetching_ref.current = true;

        const final_query = _.merge<ServerQueryParam<T>, ServerQueryParam<T>>(
            query || {},
            { page, limit: query?.limit || limit },
        );

        if (debug) {
            console.log("final_query", final_query);
        }

        adminCrudHandler<T>({
            action: "get",
            table,
            sql_query: final_query,
            count: add_count_param,
            request_query,
            ...args,
        })
            .then((result) => {
                if (debug) {
                    console.log("Main result", result);
                }

                setRes(result.payload || []);
                setCount(result?.count);
            })
            .catch((err) => {
                console.log(`Error querying ${table} => ${err.message}`);
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
    }, [res, initial_ready]);

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
