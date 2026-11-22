import AppError from "@/src/utils/app-error";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { ConnectorProviderId, ConnectorStatus } from "@/src/dict/connector-dict";

type Params = {
    connection_id: number | string;
};

export type ConnectorConnectionRow = {
    id: number;
    provider: ConnectorProviderId;
    name: string;
    /**
     * Encrypted; only `connectorProviderFor` decrypts it.
     */
    api_key: string;
    status: ConnectorStatus;
    last_error: string;
    last_synced_at: number | null;
    user_id: number;
};

/**
 * One provider connection, as stored: two of the same provider (Composio
 * Personal, Composio Work) are told apart by their row, and each has its
 * own key.
 */
export default async function grabConnectorConnection({ connection_id }: Params): Promise<ConnectorConnectionRow> {
    const row = (
        await BunSQLite.sql<{
            id: number;
            provider: string;
            name: string;
            api_key: string;
            status: string;
            last_error: string;
            last_synced_at: number;
            user_id: number;
        }>({
            sql: `SELECT id, provider, name, api_key, status, last_error, last_synced_at, user_id FROM connector_connections WHERE id = ?`,
            values: [Number(connection_id)],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That connector connection doesn't exist.`);

    return {
        id: Number(row.id),
        provider: (row.provider || "composio") as ConnectorProviderId,
        name: row.name || "",
        api_key: row.api_key || "",
        status: (row.status || "untested") as ConnectorStatus,
        last_error: row.last_error || "",
        last_synced_at: typeof row.last_synced_at == "number" ? row.last_synced_at : null,
        user_id: Number(row.user_id),
    };
}