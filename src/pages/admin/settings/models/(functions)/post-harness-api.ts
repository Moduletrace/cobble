import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { HarnessOverviewPayload } from "@/src/types";
import { clearHarnessCache } from "@/src/utils/harness-cache";

type Params = {
    /**
     * Under `/api/admin/harness/`, e.g. `save-provider`.
     */
    path: "save-provider" | "sync-provider" | "delete-provider" | "save-settings";
    body: Record<string, unknown>;
};

/**
 * Posts to a harness API route. Every route answers with the fresh page
 * data in `singleRes`, so the page updates in place.
 */
export default async function postHarnessApi({ path, body }: Params) {
    const res = await fetchApi<
        Record<string, unknown>,
        APIResponseObject<HarnessOverviewPayload>
    >(`/api/admin/harness/${path}`, {
        method: "POST",
        body,
    });

    if (res.success) clearHarnessCache();

    return res;
}
