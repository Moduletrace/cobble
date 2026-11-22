import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ConnectorConnectionsPayload } from "@/src/types";

/**
 * Reads the connectors page's connections again after one is added, synced
 * or deleted, without the apps themselves: those live on their own page.
 */
export default async function readConnectorConnections() {
    return await fetchApi<Record<string, unknown>, APIResponseObject<ConnectorConnectionsPayload>>(
        "/api/admin/connectors/connections",
        { method: "GET" },
    );
}