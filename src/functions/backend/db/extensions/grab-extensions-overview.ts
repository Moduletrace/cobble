import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CUSTOM_TOOLS, BUN_SQLITE_COBBLE_MCP_SERVERS } from "@/db/types/db";
import { CustomToolKinds } from "@/src/dict/custom-tool-dict";
import { McpTransports } from "@/src/dict/mcp-dict";
import type { BotExtension, BotExtensionsPayload } from "@/src/types";
import parseCustomToolRow from "./parse-custom-tool-row";
import parseMcpServerRow from "./parse-mcp-server-row";

type Params = {
    /**
     * Whether the viewer can give and take them: only then is what can be
     * added listed.
     */
    can_manage: boolean;
    /**
     * A bot's: given to it, and (with `workspace_id`) that workspace's
     * too, not removable from the bot. Without it, only the workspace's.
     */
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

type Linked<T> = T & { source: "bot" | "workspace" };

/**
 * The MCP servers and tools a bot or a workspace has, and the rest of
 * them, which can be added (`grabBotExtensionsOverview`,
 * `grabWorkspaceExtensionsOverview`).
 */
export default async function grabExtensionsOverview({
    can_manage,
    bot_id,
    workspace_id,
}: Params): Promise<BotExtensionsPayload> {
    const bot = Number(bot_id || 0);
    const workspace = Number(workspace_id || 0);

    const linked = (column: string, bot_link: string, workspace_link: string) => ({
        sql: `SELECT x.*, CASE WHEN x.id IN (SELECT ${column} FROM ${bot_link} WHERE bot_id = ?) THEN 'bot' ELSE 'workspace' END AS source
            FROM %TABLE% x WHERE x.id IN (SELECT ${column} FROM ${bot_link} WHERE bot_id = ?)
            OR x.id IN (SELECT ${column} FROM ${workspace_link} WHERE workspace_id = ?)
            ORDER BY x.name COLLATE NOCASE ASC`,
        values: [bot, bot, workspace],
    });

    const mcp_query = linked("mcp_server_id", "bot_mcp_servers", "workspace_mcp_servers");
    const tool_query = linked("custom_tool_id", "bot_custom_tools", "workspace_custom_tools");

    const [servers, tools, all_servers, all_tools] = await Promise.all([
        BunSQLite.sql<Linked<BUN_SQLITE_COBBLE_MCP_SERVERS>>({
            sql: mcp_query.sql.replace("%TABLE%", "mcp_servers"),
            values: mcp_query.values,
        }),
        BunSQLite.sql<Linked<BUN_SQLITE_COBBLE_CUSTOM_TOOLS>>({
            sql: tool_query.sql.replace("%TABLE%", "custom_tools"),
            values: tool_query.values,
        }),
        can_manage
            ? BunSQLite.sql<{ id: number; name: string }>({ sql: `SELECT id, name FROM mcp_servers ORDER BY name COLLATE NOCASE` })
            : null,
        can_manage
            ? BunSQLite.sql<{ id: number; name: string }>({ sql: `SELECT id, name FROM custom_tools ORDER BY name` })
            : null,
    ]);

    const attached: BotExtension[] = [
        ...(servers.payload || []).map((row) => {
            const server = parseMcpServerRow({ row });
            const transport = McpTransports.find((t) => t.value == server.transport)?.value == "stdio" ? "Command" : "Remote";
            const count = server.tools.filter((tool) => !server.excluded_tools.includes(tool.name)).length;

            return {
                kind: "mcp" as const,
                id: server.id,
                name: server.name,
                description: server.description,
                detail: `MCP · ${transport}${server.status == "ok" ? ` · ${count} ${count == 1 ? "tool" : "tools"}` : ""}`,
                state: server.status,
                enabled: server.enabled,
                source: row.source,
            };
        }),
        ...(tools.payload || []).map((row) => {
            const tool = parseCustomToolRow({ row });

            return {
                kind: "tool" as const,
                id: tool.id,
                name: tool.name,
                description: tool.description,
                detail: `Tool · ${CustomToolKinds.find((k) => k.value == tool.kind)?.title || tool.kind}`,
                state: tool.status,
                enabled: tool.enabled,
                source: row.source,
            };
        }),
    ];

    /**
     * A bot can be given one its workspace has; a workspace only what it
     * hasn't.
     */
    const has = (kind: "mcp" | "tool", id: number) =>
        attached.some((item) => item.kind == kind && item.id == id && (!bot || item.source == "bot"));

    return {
        attached,
        addable: [
            ...(all_servers?.payload || [])
                .filter((row) => !has("mcp", Number(row.id)))
                .map((row) => ({ kind: "mcp" as const, id: Number(row.id), name: row.name })),
            ...(all_tools?.payload || [])
                .filter((row) => !has("tool", Number(row.id)))
                .map((row) => ({ kind: "tool" as const, id: Number(row.id), name: row.name })),
        ],
        can_manage,
    };
}
