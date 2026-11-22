import BunSQLite from "@moduletrace/bun-sqlite";
import type { SaveConnectorAccessRequest } from "@/src/schemas/connector-schema";
import assertSuperAdmin from "../access/assert-super-admin";
import grabConnector from "./grab-connector";
import syncConnector from "./sync-connector";

type Params = {
    user_id: number | string;
    data: SaveConnectorAccessRequest;
};

/**
 * Makes a connector global (every bot, every user) or gives it to these
 * workspaces. A super admin's alone: a bot attachment is a person's own and
 * goes through `setBotConnector`, so bot rows are never touched here.
 */
export default async function setConnectorAccess({ user_id, data }: Params) {
    await assertSuperAdmin({ user_id });

    const connector = await grabConnector({ connector_id: data.connector_id });
    const now = Date.now();

    await BunSQLite.sql({ sql: `DELETE FROM workspace_connectors WHERE connector_id = ?`, values: [connector.id] });

    for (const workspace_id of new Set(data.workspace_ids)) {
        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO workspace_connectors (created_at, updated_at, workspace_id, connector_id)
                SELECT ?, ?, id, ? FROM workspaces WHERE id = ?`,
            values: [now, now, connector.id, workspace_id],
        });
    }

    if (data.all_bots !== undefined) {
        await BunSQLite.sql({
            sql: `UPDATE connectors SET all_bots = ?, updated_at = ? WHERE id = ?`,
            values: [data.all_bots ? 1 : 0, now, connector.id],
        });
    } else {
        await BunSQLite.sql({ sql: `UPDATE connectors SET updated_at = ? WHERE id = ?`, values: [now, connector.id] });
    }

    if ((data.all_bots || data.workspace_ids.length) && !connector.tools.length) {
        await syncConnector({ connector_id: connector.id });
    }

    return grabConnector({ connector_id: connector.id });
}