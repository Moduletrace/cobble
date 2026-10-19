import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MCP_SERVERS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseMcpServerRow from "./parse-mcp-server-row";

type Params = {
    mcp_server_id: number | string;
};

/**
 * One MCP server, or an `AppError` when there's none.
 */
export default async function grabMcpServer({ mcp_server_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_MCP_SERVERS>({
            sql: `SELECT * FROM mcp_servers WHERE id = ?`,
            values: [mcp_server_id],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That MCP server doesn't exist.`);

    return parseMcpServerRow({ row });
}
