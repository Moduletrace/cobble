import BunSQLite from "@moduletrace/bun-sqlite";
import grabConnectorProvider from "./grab-connector-provider";
import grabConnector from "./grab-connector";
import grabConnectorAccount from "./grab-connector-account";

type Params = {
    user_id: number | string;
    account_id: number | string;
};

/**
 * Forgets one of the user's accounts: the provider's own record first (best
 * effort), then the local row and any cached session built on it. Another
 * connected account takes over as the default, so a run keeps working.
 */
export default async function disconnectConnectorAccount({ user_id, account_id }: Params) {
    const account = await grabConnectorAccount({ account_id, user_id });
    const connector = await grabConnector({ connector_id: account.connector_id });

    try {
        const provider = await grabConnectorProvider({ connector_id: connector.id });

        if (account.provider_account_id) await provider.revoke({ account: account.provider_account_id });
    } catch {
        // A provider that won't answer mustn't keep an account the user removed.
    }

    const now = Date.now();

    await BunSQLite.sql({
        sql: `DELETE FROM connector_sessions WHERE connector_id = ? AND user_id = ? AND provider_account_id = ?`,
        values: [connector.id, Number(user_id), account.provider_account_id],
    });
    await BunSQLite.sql({ sql: `DELETE FROM connector_accounts WHERE id = ?`, values: [account.id] });

    if (account.is_default) {
        const next = (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND status = 'connected' ORDER BY id ASC LIMIT 1`,
                values: [connector.id, Number(user_id)],
            })
        ).payload?.[0];

        if (next) {
            await BunSQLite.sql({
                sql: `UPDATE connector_accounts SET is_default = 1, updated_at = ? WHERE id = ?`,
                values: [now, next.id],
            });
        }
    }

    return { connector, account };
}
