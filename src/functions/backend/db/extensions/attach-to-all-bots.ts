import BunSQLite from "@moduletrace/bun-sqlite";
import { ExtensionTables, type ExtensionKind } from "./extension-tables";

type Params = {
    kind: ExtensionKind;
    id: number;
};

/**
 * Gives an MCP server or tool set to "every bot" to every bot there is,
 * the coordinator included. Each can still drop it afterwards.
 */
export default async function attachToAllBots({ kind, id }: Params) {
    const { bot_link, column } = ExtensionTables[kind];
    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO ${bot_link} (created_at, updated_at, bot_id, ${column})
            SELECT ?, ?, id, ? FROM bots`,
        values: [now, now, id],
    });
}
