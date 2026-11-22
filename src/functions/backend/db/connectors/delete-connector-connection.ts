import BunSQLite from "@moduletrace/bun-sqlite";
import grabConnectorProvider from "./grab-connector-provider";
import grabConnectorConnection from "./grab-connector-connection";

type Params = {
    connection_id: number | string;
};

/**
 * Removes a connection with everything read from it: its apps' accounts,
 * sessions, sign-in requests and reach, then the apps, then the row. The
 * provider accounts are released first, best effort, since a key that was
 * already refused must not stop the delete.
 */
export default async function deleteConnectorConnection({ connection_id }: Params) {
    const connection = await grabConnectorConnection({ connection_id });
    const ids = (
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM connectors WHERE connection_id = ?`,
                values: [connection.id],
            })
        ).payload || []
    ).map((row) => Number(row.id));

    for (const connector_id of ids) {
        try {
            const provider = await grabConnectorProvider({ connector_id });
            const accounts =
                (
                    await BunSQLite.sql<{ provider_account_id: string }>({
                        sql: `SELECT provider_account_id FROM connector_accounts WHERE connector_id = ?`,
                        values: [connector_id],
                    })
                ).payload || [];

            for (const account of accounts) {
                if (account.provider_account_id) await provider.revoke({ account: account.provider_account_id });
            }
        } catch {
            // The key may already be refused; the rows still go.
        }
    }

    if (ids.length) {
        const placeholders = ids.map(() => "?").join(", ");

        await BunSQLite.sql({ sql: `DELETE FROM connector_sessions WHERE connector_id IN (${placeholders})`, values: ids });
        await BunSQLite.sql({ sql: `DELETE FROM connector_requests WHERE connector_id IN (${placeholders})`, values: ids });
        await BunSQLite.sql({ sql: `DELETE FROM connector_accounts WHERE connector_id IN (${placeholders})`, values: ids });
        await BunSQLite.sql({ sql: `DELETE FROM bot_connectors WHERE connector_id IN (${placeholders})`, values: ids });
        await BunSQLite.sql({ sql: `DELETE FROM workspace_connectors WHERE connector_id IN (${placeholders})`, values: ids });
        await BunSQLite.sql({ sql: `DELETE FROM connectors WHERE connection_id = ?`, values: [connection.id] });
    }

    await BunSQLite.sql({ sql: `DELETE FROM connector_connections WHERE id = ?`, values: [connection.id] });

    return { name: connection.name, apps: ids.length };
}