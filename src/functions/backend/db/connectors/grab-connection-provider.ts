import connectorProviderFor from "@/src/harness/connectors/connector-provider-for";
import type { ConnectorProvider } from "@/src/harness/connectors/connector-provider";
import grabConnectorConnection from "./grab-connector-connection";

type Params = {
    connection_id: number | string;
};

/**
 * The provider adapter for a connection on its own, before any of its apps
 * are stored: what the Connect action lists the catalog with.
 */
export default async function grabConnectionProvider({ connection_id }: Params): Promise<ConnectorProvider> {
    const connection = await grabConnectorConnection({ connection_id });

    return connectorProviderFor({
        connection: { provider: connection.provider, name: connection.name, api_key: connection.api_key },
    });
}