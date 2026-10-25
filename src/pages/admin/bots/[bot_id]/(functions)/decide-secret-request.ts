import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { SecretRequestView } from "@/src/types";

type Params = {
    request_id: number;
    /**
     * The secret the user typed; none declines the request.
     */
    value?: string;
};

/**
 * Saves the secret a bot asked for from its card, or declines it,
 * returning the request as it now stands (never the value).
 */
export default async function decideSecretRequest({ request_id, value }: Params) {
    return await fetchApi<{ request_id: number; value?: string }, APIResponseObject<SecretRequestView>>(
        `/api/admin/secret-requests/${value === undefined ? "decline" : "answer"}-request`,
        { method: "POST", body: value === undefined ? { request_id } : { request_id, value } },
    );
}
