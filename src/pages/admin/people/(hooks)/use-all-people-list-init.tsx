import _ from "lodash";
import { AppData } from "@/src/data/app-data";
import { useContext, useRef } from "react";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import type { ApiReqParams, UserType } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import EJSON from "@/src/utils/ejson";
import { useUsersGet } from "@/src/hooks/use-users-get";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";

type Props = {
    users_type?: UserType | null;
};

export default function useAllPeopleListInit({ users_type }: Props) {
    const { pageProps, query } = useContext(AppContext);
    const { user_types, url } = pageProps || {};

    const limit = AppData["DefaultQueryLimit"];
    const can_view_users = checkUserAccess({
        user_types,
        includes: ["admin"],
    });

    let location_query = EJSON.parse(url?.searchParams?.q || "") as
        | ApiReqParams
        | undefined;

    if (query?.user_type) {
        if (!location_query) {
            location_query = {
                target_user_type: query.user_type as any,
            };
        } else {
            location_query.target_user_type = query.user_type as any;
        }
    }

    const {
        users: people,
        count,
        page,
        setPage,
        setUsersQuery,
        setUsers: set_people,
        ready,
    } = useUsersGet({
        query: location_query,
    });

    const selected = useRef(new Set<BUN_SQLITE_COBBLE_USERS_JOIN>());

    const { refresh, setRefresh } = useStatus();

    return {
        user_types,
        limit,
        can_view_users,
        people,
        count,
        page,
        setPage,
        setUsersQuery,
        set_people,
        selected,
        refresh,
        setRefresh,
        users_type,
        location_query,
        ready,
    };
}
