import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { HarnessCatalogPayload } from "@/src/types";

/**
 * The install-wide models catalog, shared by every conversation's models
 * modal and cached once per user.
 */
export default async function fetchHarnessCatalog() {
    return await fetchApi<
        Record<string, never>,
        APIResponseObject<HarnessCatalogPayload>
    >(`/api/admin/harness/catalog`, {
        method: "POST",
        body: {},
    });
}
