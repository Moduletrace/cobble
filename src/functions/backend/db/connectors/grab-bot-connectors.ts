import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS, BUN_SQLITE_COBBLE_CONNECTORS } from "@/db/types/db";
import type { BotConnectorEntry, ConnectorAccountRecord, ConnectorRecord } from "@/src/types";
import botConnectorsSql from "@/src/utils/bot-connectors-sql";
import connectorAccountReachSql from "@/src/utils/connector-account-reach-sql";
import attachConnectorAccountScopes from "./attach-connector-account-scopes";
import parseConnectorAccountRow from "./parse-connector-account-row";
import parseConnectorRow from "./parse-connector-row";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
};

type AccountRow = BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS & { owner_name?: string };
type ConnectorRow = BUN_SQLITE_COBBLE_CONNECTORS & { connection_name?: string };

/**
 * The connectors a conversation's bot can use for this user, with the
 * accounts that reach there: this user's own (whatever their status, so a
 * pending sign-in still shows), every connected account of a connector given
 * to this workspace, and any connected account given to this bot, this
 * workspace or every bot, named with its owner. Each app says where it comes
 * from: the install, this workspace, this user's own attachment, or an
 * account given here.
 */
export default async function grabBotConnectors({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<BotConnectorEntry[]> {
    const reach = botConnectorsSql({ bot_id, user_id, workspace_id });
    const found =
        (
            await BunSQLite.sql<ConnectorRow>({
                sql: `SELECT c.*, cc.name AS connection_name
                    FROM (${reach.sql}) c JOIN connector_connections cc ON cc.id = c.connection_id`,
                values: reach.values,
            })
        ).payload || [];

    if (!found.length) return [];

    const connectors = found.map((row) => parseConnectorRow({ row }));
    const connection_names = new Map(found.map((row) => [Number(row.id), row.connection_name || ""]));
    const ids = connectors.map((connector) => connector.id);
    const placeholders = ids.map(() => "?").join(", ");
    const workspace_reach = connectorAccountReachSql({ workspace_id });

    const [account_res, workspace_res, bot_res] = await Promise.all([
        BunSQLite.sql<AccountRow>({
            sql: `SELECT a.*, trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) AS owner_name
                FROM connector_accounts a
                LEFT JOIN users u ON u.id = a.user_id
                WHERE a.connector_id IN (${placeholders}) AND (
                    a.user_id = ?
                    OR (
                        a.status = 'connected' AND (
                            a.all_bots = 1
                            OR EXISTS (SELECT 1 FROM connector_account_bots ab WHERE ab.account_id = a.id AND ab.bot_id = ?)
                            ${workspace_id ? `OR EXISTS (SELECT 1 FROM connector_account_workspaces aw WHERE aw.account_id = a.id AND aw.workspace_id = ?)` : ""}
                            ${workspace_reach.sql}
                        )
                    )
                )
                ORDER BY a.id ASC`,
            values: [
                ...ids,
                Number(user_id),
                Number(bot_id),
                ...(workspace_id ? [Number(workspace_id)] : []),
                ...workspace_reach.values,
            ],
        }),
        BunSQLite.sql<{ connector_id: number }>({
            sql: `SELECT connector_id FROM workspace_connectors WHERE connector_id IN (${placeholders})`,
            values: [...ids],
        }),
        BunSQLite.sql<{ connector_id: number }>({
            sql: `SELECT connector_id FROM bot_connectors WHERE connector_id IN (${placeholders}) AND bot_id = ? AND user_id = ?`,
            values: [...ids, Number(bot_id), Number(user_id)],
        }),
    ]);

    const account_rows = account_res.payload || [];
    const scopes = await attachConnectorAccountScopes({
        account_ids: account_rows.map((row) => Number(row.id)),
    });
    const accounts = account_rows.map((row) =>
        parseConnectorAccountRow({
            row,
            workspace_ids: scopes.get(Number(row.id))?.workspace_ids || [],
            bot_ids: scopes.get(Number(row.id))?.bot_ids || [],
            owner_name: row.owner_name || "",
        }),
    );
    const in_workspace = new Set((workspace_res.payload || []).map((row) => Number(row.connector_id)));
    const on_bot = new Set((bot_res.payload || []).map((row) => Number(row.connector_id)));

    return connectors.map((connector): BotConnectorEntry => {
        const via = connector.all_bots
            ? "global"
            : in_workspace.has(connector.id)
              ? "workspace"
              : on_bot.has(connector.id)
                ? "bot"
                : "account";

        const own = accounts.filter((account) => account.connector_id == connector.id);

        return {
            connector,
            connection_name: connection_names.get(connector.id) || "",
            via,
            accounts: own,
            removable:
                via == "bot" ||
                (via == "account" &&
                    own.some(
                        (account) =>
                            Number(account.user_id) == Number(user_id) &&
                            !account.all_bots &&
                            account.bot_ids.map(Number).includes(Number(bot_id)),
                    )),
        };
    });
}