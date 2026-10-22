import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { EnvsMutationResult } from "@/src/types";

type Params = {
    /**
     * Under `/api/admin/envs/`.
     */
    path: "save-env" | "delete-env";
    body: Record<string, unknown>;
};

/**
 * Posts to an env API route. Every route answers with the fresh page data
 * in `singleRes`: the whole Environment overview, or just the one bot's or
 * workspace's envs (the settings pages, `body.scoped`), so the page updates
 * in place.
 */
export default async function postEnvApi({ path, body }: Params) {
    return await fetchApi<Record<string, unknown>, APIResponseObject<EnvsMutationResult>>(
        `/api/admin/envs/${path}`,
        { method: "POST", body },
    );
}
