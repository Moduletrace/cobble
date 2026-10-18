import _ from "lodash";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import adminFetchHandler from "../functions/frontend/admin-fetch-handler";
import type { ApiReqParams } from "../types";
import type { BUN_SQLITE_BSQLITE_USERS_JOIN } from "../types/sql-joins";
import { useEffect, useRef, useState } from "react";
import EJSON from "../utils/ejson";

type Params = {
    query?: ApiReqParams;
    debug?: boolean;
    page?: number;
    initial_users?: BUN_SQLITE_BSQLITE_USERS_JOIN[];
};

export function useUsersGet({
    query: req_query,
    debug,
    page: initial_page,
    initial_users,
}: Params) {
    const [users, setUsers] = useState<
        BUN_SQLITE_BSQLITE_USERS_JOIN[] | undefined
    >(initial_users);
    const [count, setCount] = useState<number | undefined>();
    const [page, setPage] = useState<number>(initial_page || 1);
    const [usersQuery, setUsersQuery] = useState<ApiReqParams | undefined>(
        req_query,
    );

    const { ready, setReady } = useStatus();

    const fetching_ref = useRef(true);

    useEffect(() => {
        if (users) return;

        fetching_ref.current = true;

        const final_query = _.merge<ApiReqParams, ApiReqParams>(
            usersQuery || {},
            {
                page,
                count: true,
            },
        );

        if (debug) {
            console.log("final_query", final_query);
        }

        adminFetchHandler<BUN_SQLITE_BSQLITE_USERS_JOIN>({
            url: `/api/admin/grab-users`,
            query: final_query,
        })
            .then((result) => {
                if (debug) {
                    console.log("Main result", result);
                }

                setUsers(result.payload || []);
                setCount(result?.count);
            })
            .catch((err) => {
                console.log(`Error querying users table => ${err.message}`);
                setUsers([]);
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
    }, [users]);

    useEffect(() => {
        if (!ready) return;
        if (fetching_ref.current) return;
        setUsers(undefined);
    }, [page]);

    useEffect(() => {
        if (!ready) return;
        if (fetching_ref.current) return;
        if (usersQuery) {
            const url = new URL(window.location.href);
            url.searchParams.set("q", EJSON.stringify(usersQuery || {}) || "");
            history.pushState(null, "", url);
        }
        setPage(1);
        setUsers(undefined);
    }, [usersQuery]);

    return {
        users,
        setUsers,
        count,
        page,
        setPage,
        usersQuery,
        setUsersQuery,
        ready,
        setReady,
    };
}
