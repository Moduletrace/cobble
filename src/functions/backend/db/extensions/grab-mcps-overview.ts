import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MCP_SERVERS } from "@/db/types/db";
import type { McpServersOverviewPayload } from "@/src/types";
import grabCrewRole from "../access/grab-crew-role";
import grabExtensionAccess from "./grab-extension-access";
import grabExtensionTargets from "./grab-extension-targets";
import parseMcpServerRow from "./parse-mcp-server-row";

type Params = {
    user_id: number | string;
};

/**
 * The MCPs settings page: every MCP server with who gets it, and what it
 * can be attached to. How a server is reached (URL, headers, command,
 * env) only goes to the super admin.
 */
export default async function grabMcpsOverview({ user_id }: Params): Promise<McpServersOverviewPayload> {
    const role = await grabCrewRole({ user_id });
    const [rows, access, targets] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_MCP_SERVERS>({ sql: `SELECT * FROM mcp_servers ORDER BY name COLLATE NOCASE ASC, id ASC` }),
        grabExtensionAccess({ kind: "mcp" }),
        grabExtensionTargets({ role }),
    ]);

    return {
        ...targets,
        servers: (rows.payload || []).map((row) => {
            const { url, headers, command, setup_command, env, all_bots, ...server } = parseMcpServerRow({ row });

            return {
                ...server,
                access: { all_bots, ...access(server.id) },
                ...(targets.can_edit ? { url, headers, command, setup_command, env } : {}),
            };
        }),
    };
}
