import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Params = {
    env_id: number;
};

/**
 * A secret's value, for a Reveal or Copy click. Throws why when the
 * viewer may not see it.
 */
export default async function revealSecret({ env_id }: Params): Promise<string> {
    const res = await fetchApi<{ env_id: number }, APIResponseObject<{ value: string }>>(
        `/api/admin/secrets/reveal-secret`,
        { method: "POST", body: { env_id } },
    );

    if (!res?.success || typeof res.singleRes?.value != "string") {
        throw new Error(res?.msg || `Couldn't read the secret.`);
    }

    return res.singleRes.value;
}
