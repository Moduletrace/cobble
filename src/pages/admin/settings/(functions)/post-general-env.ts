import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { EnvKeyOption } from "@/src/types";

type Params = {
    key: string;
    value: string;
    description?: string;
};

/**
 * Adds a general secret from an MCP server's form. Answers with the fresh
 * list of keys, so the form can select the one just saved.
 */
export default async function postGeneralEnv({ key, value, description }: Params) {
    return await fetchApi<Record<string, unknown>, APIResponseObject<EnvKeyOption[]>>(
        "/api/admin/envs/general-envs",
        { method: "POST", body: { key, value, description } },
    );
}