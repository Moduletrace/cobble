import type { User } from "../types";
import { useEffect, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export function useLocalUser() {
    const [user, setUser] = useState<User>();
    const [userTypes, setUserTypes] =
        useState<BUN_SQLITE_COBBLE_USER_TYPES[]>();

    useEffect(() => {
        fetchApi<any, APIResponseObject>(`/api/admin/user-auth`).then((res) => {
            if (res.singleRes) {
                setUser(res.singleRes as User);
            }
            if (res.payload) {
                setUserTypes(res.payload as BUN_SQLITE_COBBLE_USER_TYPES[]);
            }
        });
    }, []);

    return {
        user,
        user_types: userTypes,
    };
}