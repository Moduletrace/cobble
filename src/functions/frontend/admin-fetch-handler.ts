import type { BUN_SQLITE_COBBLE_ALL_TYPEDEFS } from "@/db/types/db";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { AdminFetchParams, ApiReqParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function adminFetchHandler<
    T extends {} = BUN_SQLITE_COBBLE_ALL_TYPEDEFS,
>({ url: passed_url, method = "GET", query, body }: AdminFetchParams<T>) {
    let url = passed_url;

    const res = await fetchApi<ApiReqParams<T>, APIResponseObject<T>>(url, {
        method,
        body,
        query,
    });

    if (!res.debug) {
        res.debug = {};
    }

    res.debug.url = url;
    res.debug.query = query;
    res.debug.body = body;

    return res;
}
