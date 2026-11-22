import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS, BUN_SQLITE_COBBLE_CONNECTORS } from "@/db/types/db";
import type { ConnectorAccountRecord, ConnectorRecord } from "@/src/types";
import botConnectorsSql from "@/src/utils/bot-connectors-sql";
import attachConnectorAccountScopes from "./attach-connector-account-scopes";
import parseConnectorAccountRow from "./parse-connector-account-row";
import parseConnectorRow from "./parse-connector-row";

type Params = {
    /**
     * The user the run is for: their own accounts, and the ones given to
     * this place.
     */
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
};

export type RunConnector = {
    connector: ConnectorRecord;
    /**
     * The accounts the run may use for it: the user's own, and every one
     * given to this bot, this workspace or every bot. Empty means nothing
     * to call with: the card asks them to connect one.
     */
    accounts: ConnectorAccountRecord[];
};

type AccountRow = BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS & { owner_name?: string };

/**
 * The connectors one run reaches (`botConnectorsSql`) with the accounts it
 * may act through: its own user's, never another person's unless that
 * account was given to this bot, this workspace or every bot. A connector
 * reaches a run without any account; it only becomes callable once there is
 * one.
 */
export default async function grabRunConnectors({ user_id, bot_id, workspace_id }: Params): Promise<RunConnector[]> {
    const found =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTORS>(
                botConnectorsSql({ bot_id, user_id, workspace_id }),
            )
        ).payload || [];

    if (!found.length) return [];

    const connectors = found.map((row) => parseConnectorRow({ row }));
    const ids = connectors.map((connector) => connector.id);
    const rows =
        (
            await BunSQLite.sql<AccountRow>({
                sql: `SELECT a.*, trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) AS owner_name
                    FROM connector_accounts a
                    LEFT JOIN users u ON u.id = a.user_id
                    WHERE a.connector_id IN (${ids.map(() => "?").join(", ")})
                    AND a.status = 'connected'
                    AND (
                        a.user_id = ?
                        OR a.all_bots = 1
                        OR EXISTS (SELECT 1 FROM connector_account_bots b WHERE b.account_id = a.id AND b.bot_id = ?)
                        OR EXISTS (SELECT 1 FROM connector_account_workspaces w WHERE w.account_id = a.id AND w.workspace_id = ?)
                    )
                    ORDER BY a.id ASC`,
                values: [...ids, Number(user_id), Number(bot_id), Number(workspace_id || 0)],
            })
        ).payload || [];

    const scopes = await attachConnectorAccountScopes({ account_ids: rows.map((row) => Number(row.id)) });
    const accounts = rows.map((row) =>
        parseConnectorAccountRow({
            row,
            workspace_ids: scopes.get(Number(row.id))?.workspace_ids || [],
            bot_ids: scopes.get(Number(row.id))?.bot_ids || [],
            owner_name: row.owner_name || "",
        }),
    );

    return connectors.map((connector) => ({
        connector,
        accounts: accounts.filter((account) => account.connector_id == connector.id),
    }));
}