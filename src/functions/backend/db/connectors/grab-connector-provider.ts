import AppError from "@/src/utils/app-error";
import BunSQLite from "@moduletrace/bun-sqlite";
import connectorProviderFor from "@/src/harness/connectors/connector-provider-for";
import type { ConnectorProvider } from "@/src/harness/connectors/connector-provider";

type Params = {
    connector_id: number | string;
};

/**
 * The provider adapter for one app's connection: its own key, so the
 * catalog, the sign-ins and the tools belong to the connection the app was
 * read from (Composio Personal's Gmail, not Composio Work's).
 */
export default async function grabConnectorProvider({ connector_id }: Params): Promise<ConnectorProvider> {
    const row = (
        await BunSQLite.sql<{ provider: string; name: string; api_key: string }>({
            sql: `SELECT k.provider, k.name, k.api_key
                FROM connectors c
                JOIN connector_connections k ON k.id = c.connection_id
                WHERE c.id = ?`,
            values: [Number(connector_id)],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That connector doesn't exist.`);

    return connectorProviderFor({ connection: { provider: row.provider, name: row.name, api_key: row.api_key } });
}