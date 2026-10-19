import BunSQLite from "@moduletrace/bun-sqlite";
import attachToAllBots from "./attach-to-all-bots";
import type { BUN_SQLITE_COBBLE_MCP_SERVERS, BunSQLiteTables } from "@/db/types/db";
import { stopStdioMcpServer } from "@/src/harness/mcp/mcp-stdio-pool";
import type { SaveMcpServerRequest } from "@/src/schemas/extension-schema";
import mcpServerSlug from "@/src/utils/mcp-server-slug";
import grabMcpServer from "./grab-mcp-server";

type Params = {
    /**
     * The super admin saving it (checked by the caller).
     */
    user_id: number | string;
    data: SaveMcpServerRequest;
};

/**
 * Adds or edits an MCP server and returns its id. A new one gets a unique
 * slug from its name (kept when it's renamed, so its tools keep their
 * names). A running stdio server is stopped, so the next call starts it as
 * saved.
 */
export default async function saveMcpServer({ user_id, data }: Params) {
    const fields = {
        name: data.name,
        description: data.description,
        transport: data.transport,
        url: data.transport == "remote" ? data.url : "",
        headers: JSON.stringify(data.transport == "remote" ? data.headers : {}),
        command: data.transport == "stdio" ? data.command : "",
        setup_command: data.transport == "stdio" ? data.setup_command : "",
        env: JSON.stringify(data.transport == "stdio" ? data.env : {}),
        excluded_tools: JSON.stringify(data.excluded_tools),
        enabled: data.enabled ? 1 : 0,
        all_bots: data.all_bots ? 1 : 0,
    } as const;

    if (data.mcp_server_id) {
        const server = await grabMcpServer({ mcp_server_id: data.mcp_server_id });

        stopStdioMcpServer({ server_id: server.id });

        const res = await BunSQLite.update<BUN_SQLITE_COBBLE_MCP_SERVERS, (typeof BunSQLiteTables)[number]>({
            table: "mcp_servers",
            targetId: server.id,
            data: fields,
        });

        if (!res.success) throw new Error(`Couldn't save the MCP server: ${res.msg}`);

        if (data.all_bots && !server.all_bots) await attachToAllBots({ kind: "mcp", id: server.id });

        return server.id;
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_MCP_SERVERS, (typeof BunSQLiteTables)[number]>({
        table: "mcp_servers",
        data: [
            {
                ...fields,
                slug: await uniqueSlug({ name: data.name }),
                status: "untested",
                tools_cache: "[]",
                user_id: Number(user_id),
            },
        ],
    });

    const id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !id) throw new Error(`Couldn't add the MCP server: ${res.msg}`);

    if (data.all_bots) await attachToAllBots({ kind: "mcp", id: Number(id) });

    return Number(id);
}

async function uniqueSlug({ name }: { name: string }) {
    const base = mcpServerSlug({ name });
    const taken = new Set(
        (
            await BunSQLite.sql<{ slug: string }>({
                sql: `SELECT slug FROM mcp_servers WHERE slug = ? OR slug LIKE ?`,
                values: [base, `${base}_%`],
            })
        ).payload?.map((row) => row.slug),
    );

    if (!taken.has(base)) return base;

    for (let n = 2; ; n++) {
        if (!taken.has(`${base}_${n}`)) return `${base}_${n}`;
    }
}
