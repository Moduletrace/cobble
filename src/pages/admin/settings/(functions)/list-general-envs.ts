import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { EnvKeyOption } from "@/src/types";

/**
 * The general envs an MCP server's or browser's form can point at, read on
 * the server so a saved secret never reaches the page.
 */
export default async function listGeneralEnvs() {
    return await fetchApi<Record<string, unknown>, APIResponseObject<EnvKeyOption[]>>(
        "/api/admin/envs/general-envs",
        { method: "GET" },
    );
}