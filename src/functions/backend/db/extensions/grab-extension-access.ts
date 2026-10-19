import BunSQLite from "@moduletrace/bun-sqlite";
import { ExtensionTables, type ExtensionKind } from "./extension-tables";

type Params = {
    kind: ExtensionKind;
};

/**
 * The bots and workspaces every MCP server (or tool) is attached to, by
 * its id.
 */
export default async function grabExtensionAccess({ kind }: Params) {
    const { bot_link, workspace_link, column } = ExtensionTables[kind];
    const [bots, workspaces] = await Promise.all([
        BunSQLite.sql<{ id: number; target: number }>({
            sql: `SELECT ${column} AS id, bot_id AS target FROM ${bot_link}`,
        }),
        BunSQLite.sql<{ id: number; target: number }>({
            sql: `SELECT ${column} AS id, workspace_id AS target FROM ${workspace_link}`,
        }),
    ]);

    const access = new Map<number, { bot_ids: number[]; workspace_ids: number[] }>();
    const entry = (id: number) => {
        if (!access.has(id)) access.set(id, { bot_ids: [], workspace_ids: [] });
        return access.get(id)!;
    };

    for (const row of bots.payload || []) entry(Number(row.id)).bot_ids.push(Number(row.target));
    for (const row of workspaces.payload || []) entry(Number(row.id)).workspace_ids.push(Number(row.target));

    return (id: number) => access.get(id) || { bot_ids: [], workspace_ids: [] };
}
