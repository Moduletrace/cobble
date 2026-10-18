import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { ApiReqParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

export default async function clientDeleteMediaHandler(params: ApiReqParams) {
    const res = await fetchApi<ApiReqParams, APIResponseObject>(
        `/api/admin/delete-media`,
        {
            method: "DELETE",
            body: params,
        },
    );

    return res;
}
