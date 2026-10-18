import type { BUN_SQLITE_COBBLE_ALL_TYPEDEFS } from "@/db/types/db";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { ApiReqParams, ClientAdminCrudParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function adminCrudHandler<
    T extends {} = BUN_SQLITE_COBBLE_ALL_TYPEDEFS,
>(params: ClientAdminCrudParams<T>) {
    const {
        action,
        table,
        count,
        insert_data,
        sql_insert_params,
        sql_query,
        sql_select_params,
        update_data,
        update_on_duplicate,
        id,
    } = params;

    let url = `/api/admin/crud/${table}`;

    if (id) {
        url += `/${id}`;
    }

    let query: ApiReqParams<T> = {
        count,
        insert_data,
        sql_insert_params,
        sql_query,
        sql_select_params,
        update_data,
        update_on_duplicate,
        ...params.request_query,
        ...params.request_body,
    };

    const res = await fetchApi<ApiReqParams<T>, APIResponseObject<T>>(url, {
        method:
            action == "update"
                ? "PUT"
                : action == "delete"
                  ? "DELETE"
                  : action == "insert"
                    ? "POST"
                    : "GET",
        body: action == "get" ? undefined : query,
        query: action == "get" ? query : undefined,
    });

    if (!res.debug) {
        res.debug = {};
    }
    res.debug.url = url;
    res.debug.query = query;

    return res;
}
