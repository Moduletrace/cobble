import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_CONNECTORS,
    BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import grabBots from "../bots/grab-bots";
import grabCrewRole from "../access/grab-crew-role";
import grabUserWorkspaces from "../workspaces/grab-user-workspaces";
import attachConnectorAccountScopes from "./attach-connector-account-scopes";
import type {
    ConnectorAccess,
    ConnectorAccountRecord,
    ConnectorAppsPayload,
    ConnectorRecord,
} from "@/src/types";
import type { ConnectorAppFilter } from "@/src/dict/connector-dict";
import parseConnectorAccountRow from "./parse-connector-account-row";
import parseConnectorRow from "./parse-connector-row";

type Params = {
    /**
     * Who's looking: the accounts and the bot attachments are theirs alone.
     */
    user_id: number | string;
    connection_id: number | string;
    /**
     * What to search for, over the app's name, slug and description.
     */
    query?: string;
    /**
     * All apps, only those with a connected account the viewer can see, or
     * only those without one.
     */
    filter?: ConnectorAppFilter;
    page?: number;
    page_size?: number;
};

/**
 * One page of a connection's apps, the viewer's own accounts for those
 * apps, and where each is attached for them. A connection can hold
 * thousands of apps, so the page asks for a slice and a search rather than
 * everything at once. Apps with a connected account come first, and the
 * tabs' counts come back with the page.
 */
export default async function grabConnectorApps({
    user_id,
    connection_id,
    query = "",
    filter = "all",
    page = 1,
    page_size = AppData.ConnectorAppsPageSize,
}: Params): Promise<ConnectorAppsPayload> {
    const id = Number(user_id);
    const connection = Number(connection_id);
    const needle = query.trim();
    const like = `%${needle}%`;
    const size = Math.min(Math.max(Math.trunc(page_size) || AppData.ConnectorAppsPageSize, 1), 100);

    /**
     * The accounts this viewer may see, and the values that decide it. Used
     * both for the connected filter and for the accounts on the page.
     */
    const scope = await accountVisibility({ user_id: id });
    const connected = `EXISTS (SELECT 1 FROM connector_accounts a WHERE a.connector_id = c.id AND a.status = 'connected' AND ${scope.sql})`;
    const matches = needle
        ? `c.connection_id = ? AND (c.name LIKE ? OR c.app LIKE ? OR c.description LIKE ?)`
        : `c.connection_id = ?`;
    const match_values = needle ? [connection, like, like, like] : [connection];
    const filter_sql =
        filter == "connected"
            ? ` AND ${connected}`
            : filter == "unconnected"
              ? ` AND NOT ${connected}`
              : "";

    const counts_res = await BunSQLite.sql<{ total: number; connected: number }>({
        sql: `SELECT COUNT(*) AS total, SUM(CASE WHEN ${connected} THEN 1 ELSE 0 END) AS connected
              FROM connectors c WHERE ${matches}`,
        values: [...scope.values, ...match_values],
    });
    const counts = {
        all: Number(counts_res.payload?.[0]?.total || 0),
        connected: Number(counts_res.payload?.[0]?.connected || 0),
        unconnected: 0,
    };

    counts.unconnected = counts.all - counts.connected;

    const total =
        filter == "connected" ? counts.connected : filter == "unconnected" ? counts.unconnected : counts.all;
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.min(Math.max(Math.trunc(page) || 1, 1), pages);
    const offset = (current - 1) * size;

    const rows_res = await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTORS>({
        sql: `SELECT c.* FROM connectors c WHERE ${matches}${filter_sql}
              ORDER BY ${connected} DESC, c.name ASC LIMIT ? OFFSET ?`,
        values: [...match_values, ...scope.values, size, offset],
    });
    const rows = rows_res.payload || [];
    const ids = rows.map((row) => Number(row.id));
    const placeholders = ids.map(() => "?").join(", ");

    /**
     * The accounts this viewer may see on these apps: their own, and one
     * given out (to everyone, or to a workspace or bot they reach). A super
     * admin sees every account of the app.
     */
    const [accounts, botLinks, workspaceLinks] = await Promise.all([
        ids.length
            ? BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS & { owner_name: string }>({
                  sql: `SELECT a.*, trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')) AS owner_name
                        FROM connector_accounts a LEFT JOIN users u ON u.id = a.user_id
                        WHERE a.connector_id IN (${placeholders}) AND ${scope.sql}
                        ORDER BY a.id ASC`,
                  values: [...ids, ...scope.values],
              })
            : Promise.resolve({ payload: [] as (BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS & { owner_name: string })[] }),
        ids.length
            ? BunSQLite.sql<{ connector_id: number; bot_id: number }>({
                  sql: `SELECT connector_id, bot_id FROM bot_connectors WHERE user_id = ? AND connector_id IN (${placeholders}) ORDER BY connector_id ASC`,
                  values: [id, ...ids],
              })
            : Promise.resolve({ payload: [] as { connector_id: number; bot_id: number }[] }),
        ids.length
            ? BunSQLite.sql<{ connector_id: number; workspace_id: number }>({
                  sql: `SELECT connector_id, workspace_id FROM workspace_connectors WHERE connector_id IN (${placeholders}) ORDER BY connector_id ASC`,
                  values: [...ids],
              })
            : Promise.resolve({ payload: [] as { connector_id: number; workspace_id: number }[] }),
    ]);

    const access = new Map<number, { bot_ids: number[]; workspace_ids: number[] }>();

    function accessFor(connector_id: number) {
        let entry = access.get(connector_id);

        if (!entry) {
            entry = { bot_ids: [], workspace_ids: [] };
            access.set(connector_id, entry);
        }

        return entry;
    }

    for (const row of botLinks.payload || []) {
        accessFor(Number(row.connector_id)).bot_ids.push(Number(row.bot_id));
    }

    for (const row of workspaceLinks.payload || []) {
        accessFor(Number(row.connector_id)).workspace_ids.push(Number(row.workspace_id));
    }

    const account_rows = accounts.payload || [];
    const scopes = await attachConnectorAccountScopes({
        account_ids: account_rows.map((row) => Number(row.id)),
    });

    return {
        items: rows.map((row): ConnectorRecord => parseConnectorRow({ row })),
        total,
        page: current,
        page_size: size,
        query: needle,
        filter,
        counts,
        accounts: account_rows.map((row): ConnectorAccountRecord => {
            const shared = scopes.get(Number(row.id));

            return parseConnectorAccountRow({
                row,
                workspace_ids: shared?.workspace_ids || [],
                bot_ids: shared?.bot_ids || [],
                owner_name: row.owner_name || "",
            });
        }),
        access: rows.map((row): ConnectorAccess => ({
            connector_id: Number(row.id),
            ...(access.get(Number(row.id)) || { bot_ids: [], workspace_ids: [] }),
        })),
    };
}

/**
 * The SQL that decides which accounts of these apps the viewer may see, and
 * the values it needs after the connector ids.
 */
async function accountVisibility({ user_id }: { user_id: number }) {
    if ((await grabCrewRole({ user_id })) == "super_admin") {
        return { sql: `1 = 1`, values: [] as number[] };
    }

    const workspace_ids = (await grabUserWorkspaces({ user_id })).map((workspace) => Number(workspace.id));
    const bot_ids = (await grabBots({ user_id })).map((bot) => Number(bot.id));
    const workspaces = workspace_ids.length ? workspace_ids.map(() => "?").join(", ") : "0";
    const bots = bot_ids.length ? bot_ids.map(() => "?").join(", ") : "0";

    return {
        sql: `(a.user_id = ? OR a.all_bots = 1
            OR EXISTS (SELECT 1 FROM connector_account_workspaces w WHERE w.account_id = a.id AND w.workspace_id IN (${workspaces}))
            OR EXISTS (SELECT 1 FROM connector_account_bots b WHERE b.account_id = a.id AND b.bot_id IN (${bots})))`,
        values: [user_id, ...workspace_ids, ...bot_ids],
    };
}
