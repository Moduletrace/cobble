import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    account_ids: number[];
};

export type ConnectorAccountScopes = {
    workspace_ids: number[];
    bot_ids: number[];
};

/**
 * Where each account has been given to, read beside its row: a workspace or
 * a bot whose every run may use it, not only the owner's.
 */
export default async function attachConnectorAccountScopes({
    account_ids,
}: Params): Promise<Map<number, ConnectorAccountScopes>> {
    const scopes = new Map<number, ConnectorAccountScopes>();
    if (!account_ids.length) return scopes;

    for (const id of account_ids) scopes.set(id, { workspace_ids: [], bot_ids: [] });

    const marks = account_ids.map(() => "?").join(", ");
    const workspaces =
        (
            await BunSQLite.sql<{ account_id: number; workspace_id: number }>({
                sql: `SELECT account_id, workspace_id FROM connector_account_workspaces WHERE account_id IN (${marks}) ORDER BY workspace_id ASC`,
                values: account_ids,
            })
        ).payload || [];
    const bots =
        (
            await BunSQLite.sql<{ account_id: number; bot_id: number }>({
                sql: `SELECT account_id, bot_id FROM connector_account_bots WHERE account_id IN (${marks}) ORDER BY bot_id ASC`,
                values: account_ids,
            })
        ).payload || [];

    for (const row of workspaces) scopes.get(Number(row.account_id))?.workspace_ids.push(Number(row.workspace_id));
    for (const row of bots) scopes.get(Number(row.account_id))?.bot_ids.push(Number(row.bot_id));

    return scopes;
}