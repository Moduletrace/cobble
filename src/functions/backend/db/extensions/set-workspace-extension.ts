import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertCrewManager from "../access/assert-crew-manager";
import { ExtensionTables, type ExtensionKind } from "./extension-tables";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    kind: ExtensionKind;
    id: number;
    /**
     * Gives it to the workspace, or takes it away.
     */
    attached: boolean;
};

/**
 * Gives a workspace an MCP server or tool (every bot working there gets
 * it, there), or takes it away; for super admins and admins. Returns the
 * workspace and the item's name.
 */
export default async function setWorkspaceExtension({ user_id, workspace_id, kind, id, attached }: Params) {
    await assertCrewManager({ user_id });

    const { table, workspace_link, column, label } = ExtensionTables[kind];

    const [workspace, item] = await Promise.all([
        BunSQLite.sql<{ id: number; name: string }>({
            sql: `SELECT id, name FROM workspaces WHERE id = ?`,
            values: [workspace_id],
        }).then((res) => res.payload?.[0]),
        BunSQLite.sql<{ id: number; name: string }>({
            sql: `SELECT id, name FROM ${table} WHERE id = ?`,
            values: [id],
        }).then((res) => res.payload?.[0]),
    ]);

    if (!workspace) throw new AppError(`That workspace doesn't exist.`);
    if (!item) throw new AppError(`That ${label} doesn't exist.`);

    const now = Date.now();
    const res = attached
        ? await BunSQLite.sql({
              sql: `INSERT OR IGNORE INTO ${workspace_link} (created_at, updated_at, workspace_id, ${column}) VALUES (?, ?, ?, ?)`,
              values: [now, now, workspace.id, id],
          })
        : await BunSQLite.sql({
              sql: `DELETE FROM ${workspace_link} WHERE workspace_id = ? AND ${column} = ?`,
              values: [workspace.id, id],
          });

    if (!res.success) throw new Error(`Couldn't change the workspace's ${label}s: ${res.error}`);

    return { workspace, name: item.name };
}
