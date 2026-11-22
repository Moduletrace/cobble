import BunSQLite from "@moduletrace/bun-sqlite";
import syncConnector from "@/src/functions/backend/db/connectors/sync-connector";
import syncConnectorAccounts from "@/src/functions/backend/db/connectors/sync-connector-accounts";
import syncConnectorConnection from "@/src/functions/backend/db/connectors/sync-connector-connection";

/**
 * Keeps every connection's app list current, reads the tools of the apps
 * someone actually gave to a bot or workspace (never all of them: a
 * provider lists hundreds), and keeps accounts in line with the provider:
 * the ones a sign-in left waiting, and connected ones an hour later, so an
 * account deleted at the provider shows as revoked (and offers Reconnect)
 * without waiting for a run to fail.
 * Each connection is synced with its own key, so a refused one only affects
 * the apps it read.
 */
export default async function syncConnectors() {
    const connections =
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM connector_connections`,
            })
        ).payload || [];

    for (const connection of connections) {
        await syncConnectorConnection({ connection_id: connection.id });
    }

    const assigned =
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT c.id FROM connectors c
                    WHERE c.enabled = 1
                        AND (c.all_bots = 1
                            OR c.id IN (SELECT connector_id FROM bot_connectors)
                            OR c.id IN (SELECT connector_id FROM workspace_connectors))`,
            })
        ).payload || [];

    for (const connector of assigned) {
        await syncConnector({ connector_id: connector.id });
    }

    const now = Date.now();
    const stale_after = now - 60 * 60 * 1000;
    const waiting =
        (
            await BunSQLite.sql<{ connector_id: number; user_id: number }>({
                sql: `SELECT connector_id, user_id FROM connector_requests WHERE status = 'pending' AND expires_at > ?
                    UNION
                    SELECT connector_id, user_id FROM connector_accounts WHERE status != 'connected'
                    UNION
                    SELECT connector_id, user_id FROM connector_accounts
                        WHERE status = 'connected' AND (last_checked_at IS NULL OR last_checked_at < ?)`,
                values: [now, stale_after],
            })
        ).payload || [];

    for (const request of waiting) {
        await syncConnectorAccounts({
            user_id: request.user_id,
            connector_id: request.connector_id,
        }).catch(() => {});
    }
}