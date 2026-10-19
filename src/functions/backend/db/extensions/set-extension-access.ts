import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertCrewManager from "../access/assert-crew-manager";
import { ExtensionTables, type ExtensionKind } from "./extension-tables";

type Params = {
    user_id: number | string;
    kind: ExtensionKind;
    id: number;
    bot_ids: number[];
    workspace_ids: number[];
    /**
     * Super admins only: left alone for anyone else.
     */
    all_bots?: boolean;
};

/**
 * Attaches an MCP server or tool to exactly these bots and workspaces, for
 * super admins and admins. An admin never sees the coordinator, so its
 * attachment is kept as it is; only a super admin sets "all bots".
 */
export default async function setExtensionAccess({ user_id, kind, id, bot_ids, workspace_ids, all_bots }: Params) {
    const role = await assertCrewManager({ user_id });
    const { table, bot_link, workspace_link, column, label } = ExtensionTables[kind];

    const found = await BunSQLite.sql<{ id: number }>({ sql: `SELECT id FROM ${table} WHERE id = ?`, values: [id] });

    if (!found.payload?.[0]) throw new AppError(`That ${label} doesn't exist.`);

    const coordinator = role != "super_admin" ? `AND bot_id NOT IN (SELECT id FROM bots WHERE kind = 'coordinator')` : "";
    const now = Date.now();

    await BunSQLite.sql({ sql: `DELETE FROM ${bot_link} WHERE ${column} = ? ${coordinator}`, values: [id] });
    await BunSQLite.sql({ sql: `DELETE FROM ${workspace_link} WHERE ${column} = ?`, values: [id] });

    for (const bot_id of new Set(bot_ids)) {
        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO ${bot_link} (created_at, updated_at, bot_id, ${column})
                SELECT ?, ?, id, ? FROM bots WHERE id = ? ${role != "super_admin" ? `AND kind = 'worker'` : ""}`,
            values: [now, now, id, bot_id],
        });
    }

    for (const workspace_id of new Set(workspace_ids)) {
        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO ${workspace_link} (created_at, updated_at, workspace_id, ${column})
                SELECT ?, ?, id, ? FROM workspaces WHERE id = ?`,
            values: [now, now, id, workspace_id],
        });
    }

    if (role == "super_admin" && all_bots !== undefined) {
        await BunSQLite.sql({
            sql: `UPDATE ${table} SET all_bots = ?, updated_at = ? WHERE id = ?`,
            values: [all_bots ? 1 : 0, now, id],
        });
    }
}
