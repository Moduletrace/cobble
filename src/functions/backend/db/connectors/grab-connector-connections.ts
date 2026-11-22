import BunSQLite from "@moduletrace/bun-sqlite";
import type { ConnectorProviderId, ConnectorStatus } from "@/src/dict/connector-dict";
import type { ConnectorConnectionRecord, ConnectorConnectionsPayload } from "@/src/types";

/**
 * The install's provider connections, with how many apps each has and how
 * many of those are given out. The apps themselves stay off this read: one
 * connection can hold thousands, and the page only lists connections.
 */
export default async function grabConnectorConnections(): Promise<ConnectorConnectionsPayload> {
    const res = await BunSQLite.sql<{
        id: number;
        provider: string;
        name: string;
        api_key: string;
        status: string;
        last_error: string;
        last_synced_at: number;
        app_count: number;
        apps_given: number;
    }>({
        sql: `SELECT c.id, c.provider, c.name, c.api_key, c.status, c.last_error, c.last_synced_at,
                     (SELECT COUNT(*) FROM connectors x WHERE x.connection_id = c.id) AS app_count,
                     (SELECT COUNT(*) FROM connectors x
                       WHERE x.connection_id = c.id
                         AND (x.all_bots = 1
                           OR EXISTS (SELECT 1 FROM bot_connectors b WHERE b.connector_id = x.id)
                           OR EXISTS (SELECT 1 FROM workspace_connectors w WHERE w.connector_id = x.id))) AS apps_given
                FROM connector_connections c
               ORDER BY c.name ASC`,
    });

    return {
        connections: (res.payload || []).map(
            (row): ConnectorConnectionRecord => ({
                id: Number(row.id),
                provider: (row.provider || "composio") as ConnectorProviderId,
                name: row.name || "",
                status: (row.status || "untested") as ConnectorStatus,
                last_error: row.last_error || "",
                last_synced_at: typeof row.last_synced_at == "number" ? row.last_synced_at : null,
                /**
                 * The key is encrypted at rest and never sent to a page, so
                 * this only says whether one is stored.
                 */
                has_key: Boolean(String(row.api_key || "").trim()),
                app_count: Number(row.app_count || 0),
                apps_given: Number(row.apps_given || 0),
            }),
        ),
    };
}