import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS } from "@/db/types/db";
import type { ConnectorAccountRecord } from "@/src/types";
import attachConnectorAccountScopes from "./attach-connector-account-scopes";
import parseConnectorAccountRow from "./parse-connector-account-row";

type Params = {
    user_id: number | string;
    connector_id: number | string;
    bot_id?: number | string;
    workspace_id?: number | string;
};

type Row = BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS & { owner_name?: string };

/**
 * This user's own accounts of one app that are not given here yet, whatever
 * their state, with where each one may be used. The tools modal lists them so
 * an account can be given to the bot right where it is picked; one already
 * given to this bot, to every bot or to this workspace is left out.
 */
export default async function grabConnectorOwnAccounts({
    user_id,
    connector_id,
    bot_id,
    workspace_id,
}: Params): Promise<ConnectorAccountRecord[]> {
    const bot = Number(bot_id) || 0;
    const workspace = Number(workspace_id) || 0;
    const rows =
        (
            await BunSQLite.sql<Row>({
                sql: `SELECT a.*, trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) AS owner_name
                    FROM connector_accounts a
                    LEFT JOIN users u ON u.id = a.user_id
                    WHERE a.connector_id = ? AND a.user_id = ?
                        AND a.all_bots = 0
                        AND NOT EXISTS (
                            SELECT 1 FROM connector_account_bots ab
                            WHERE ab.account_id = a.id AND ab.bot_id = ?
                        )
                        AND NOT EXISTS (
                            SELECT 1 FROM connector_account_workspaces aw
                            WHERE aw.account_id = a.id AND aw.workspace_id = ?
                        )
                    ORDER BY a.id ASC`,
                values: [Number(connector_id), Number(user_id), bot, workspace],
            })
        ).payload || [];

    const scopes = await attachConnectorAccountScopes({ account_ids: rows.map((row) => Number(row.id)) });

    return rows.map((row) => {
        const scope = scopes.get(Number(row.id));

        return parseConnectorAccountRow({
            row,
            workspace_ids: scope?.workspace_ids || [],
            bot_ids: scope?.bot_ids || [],
            owner_name: row.owner_name || "",
        });
    });
}
