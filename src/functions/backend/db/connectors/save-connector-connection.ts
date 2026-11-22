import AppError from "@/src/utils/app-error";
import BunSQLite from "@moduletrace/bun-sqlite";
import { ConnectorProviders, type ConnectorProviderId } from "@/src/dict/connector-dict";
import { encrypt } from "@/src/utils/crypt";

type Params = {
    /**
     * The row to change; left out to add a connection.
     */
    connection_id?: number | null;
    provider: string;
    name: string;
    /**
     * A new key. Left out when editing keeps the stored one, which is never
     * sent back to the page.
     */
    api_key?: string;
    user_id: number | string;
};

export type SavedConnectorConnection = {
    id: number;
    provider: ConnectorProviderId;
    name: string;
};

/**
 * Adds or renames a provider connection, with its own key: Composio
 * Personal and Composio Work are two rows, so each lists the apps its key
 * holds. The key is encrypted before it is stored and never read back to a
 * page.
 */
export default async function saveConnectorConnection({ connection_id, provider, name, api_key, user_id }: Params): Promise<SavedConnectorConnection> {
    const preset = ConnectorProviders.find((entry) => entry.value == provider);

    if (!preset) throw new AppError(`This install has no connector provider called "${provider}".`);

    const clean_name = name.trim().slice(0, 80);

    if (!clean_name) throw new AppError(`Give the connection a name, e.g. ${preset.title} Work.`);

    const taken = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM connector_connections WHERE name = ? COLLATE NOCASE AND id != ?`,
            values: [clean_name, Number(connection_id || 0)],
        })
    ).payload?.[0];

    if (taken) throw new AppError(`A connection called "${clean_name}" already exists.`);

    if (connection_id) {
        await BunSQLite.sql({
            sql: api_key
                ? `UPDATE connector_connections SET name = ?, api_key = ?, status = 'untested', last_error = '', updated_at = ? WHERE id = ?`
                : `UPDATE connector_connections SET name = ?, updated_at = ? WHERE id = ?`,
            values: api_key
                ? [clean_name, await encrypt(api_key.trim()), Date.now(), Number(connection_id)]
                : [clean_name, Date.now(), Number(connection_id)],
        });

        return { id: Number(connection_id), provider: preset.value, name: clean_name };
    }

    if (!api_key?.trim()) throw new AppError(`Paste the ${preset.title} key this connection uses.`);

    const now = Date.now();
    await BunSQLite.sql({
        sql: `INSERT INTO connector_connections (created_at, updated_at, name, provider, api_key, status, last_error, user_id)
            VALUES (?, ?, ?, ?, ?, 'untested', '', ?)`,
        values: [now, now, clean_name, preset.value, await encrypt(api_key.trim()), Number(user_id)],
    });

    const created = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM connector_connections WHERE name = ?`,
            values: [clean_name],
        })
    ).payload?.[0];
    const id = Number(created?.id || 0);

    if (!id) throw new AppError(`Couldn't store the connection.`);

    return { id, provider: preset.value, name: clean_name };
}