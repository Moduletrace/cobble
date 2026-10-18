import type { BUN_SQLITE_BSQLITE_MEDIA } from "@/db/types/db";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { ApiReqParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bun-sqlite";

export default async function clientUploadMediaHandler(params: ApiReqParams) {
    const res = await fetchApi<
        ApiReqParams,
        APIResponseObject<BUN_SQLITE_BSQLITE_MEDIA>
    >(`/api/admin/upload-media`, {
        method: "POST",
        body: params,
    });

    return res;
}
