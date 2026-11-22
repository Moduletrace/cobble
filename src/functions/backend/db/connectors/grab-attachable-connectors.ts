import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTORS } from "@/db/types/db";
import type { AttachableConnector } from "@/src/types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    query?: string;
    connection_id?: number | string;
    workspace_id?: number | string;
};

type Row = BUN_SQLITE_COBBLE_CONNECTORS & {
    connection_name?: string;
    attached?: number;
};

const Limit = 20;

/**
 * Apps this user can still add to this bot themselves: enabled apps of every
 * connection (or of the one named) with a connected account of their own.
 * An app this user already attached to this bot is left out (the app itself
 * is already there); an account already given here is left out of the app's
 * accounts by `grabConnectorOwnAccounts`, not out of this list.
 */
export default async function grabAttachableConnectors({
    user_id,
    bot_id,
    query = "",
    connection_id,
    workspace_id,
}: Params): Promise<AttachableConnector[]> {
    const search = `%${query.trim()}%`;
    const connection = Number(connection_id) ? Number(connection_id) : 0;
    const workspace = Number(workspace_id) ? Number(workspace_id) : 0;
    const rows =
        (
            await BunSQLite.sql<Row>({
                sql: `SELECT c.*, cc.name AS connection_name
                    FROM connectors c
                    JOIN connector_connections cc ON cc.id = c.connection_id
                    WHERE c.enabled = 1 AND (c.name LIKE ? OR c.app LIKE ?)
                        AND (? = 0 OR c.connection_id = ?)
                        AND NOT EXISTS (
                            SELECT 1 FROM bot_connectors bc
                            WHERE bc.bot_id = ? AND bc.user_id = ? AND bc.connector_id = c.id
                        )
                        AND EXISTS (
                            SELECT 1 FROM connector_accounts a
                            WHERE a.connector_id = c.id AND a.status = 'connected' AND a.user_id = ?
                        )
                    ORDER BY c.name ASC
                    LIMIT ?`,
                values: [
                    search,
                    search,
                    connection,
                    connection,
                    Number(bot_id),
                    Number(user_id),
                    Number(user_id),
                    Limit,
                ],
            })
        ).payload || [];

    return rows.map((row) => ({
        id: Number(row.id),
        name: row.name || "",
        app: row.app || "",
        logo: row.logo || "",
        connection_name: row.connection_name || "",
        attached: false,
    }));
}