import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Params = {
    /**
     * Under `/api/admin/`, e.g. `workspaces/create-workspace`.
     */
    path: string;
    body: Record<string, unknown>;
};

/**
 * Posts to an admin API route.
 */
export default async function postAdminApi<T extends { [k: string]: any } = { [k: string]: any }>({ path, body }: Params) {
    return await fetchApi<Record<string, unknown>, APIResponseObject<T>>(`/api/admin/${path}`, {
        method: "POST",
        body,
    });
}
