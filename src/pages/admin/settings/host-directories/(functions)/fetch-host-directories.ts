import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { HostDirectoryWithLinks } from "@/src/types";

/**
 * Every host directory with the computers and workspaces it is mounted in.
 */
export default async function fetchHostDirectories() {
    return await fetchApi<
        Record<string, never>,
        APIResponseObject<HostDirectoryWithLinks>
    >(`/api/admin/host-directories/grab-host-directories`, {
        method: "GET",
    });
}