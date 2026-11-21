import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MCP_SERVERS } from "@/db/types/db";
import type { SaveMcpServerRequest } from "@/src/schemas/extension-schema";
import extensionEnvUses from "@/src/utils/extension-env-uses";
import redactTemplateMap from "@/src/utils/redact-template-map";
import parseMcpServerRow from "../extensions/parse-mcp-server-row";
import type { ExtensionBundleEntry } from "./extension-bundle-entry";

type Params = {
    /**
     * The rows picked, or none for every one.
     */
    ids: number[];
};

/**
 * MCP servers as a bundle carries them: how each is reached, with its own
 * header and env values left behind (listed in `redacted`, so the import
 * says which), and never who it's attached to.
 */
export default async function exportMcps({ ids }: Params): Promise<ExtensionBundleEntry[]> {
    const rows = await BunSQLite.sql<BUN_SQLITE_COBBLE_MCP_SERVERS>({
        sql: `SELECT * FROM mcp_servers ORDER BY name COLLATE NOCASE ASC, id ASC`,
    });

    const wanted = ids.length ? new Set(ids.map(Number)) : null;

    return (rows.payload || [])
        .map((row) => parseMcpServerRow({ row }))
        .filter((server) => !wanted || wanted.has(server.id))
        .map((server) => {
            const remote = server.transport == "remote";
            const headers = redactTemplateMap({ values: remote ? server.headers : {}, label: "header" });
            const env = redactTemplateMap({ values: remote ? {} : server.env, label: "env" });

            const config: SaveMcpServerRequest = {
                name: server.name,
                description: server.description,
                transport: server.transport,
                url: remote ? server.url : "",
                headers: headers.values,
                auth_scheme: remote ? server.auth_scheme : "none",
                auth_header: remote ? server.auth_header : "",
                command: remote ? "" : server.command,
                setup_command: remote ? "" : server.setup_command,
                env: env.values,
                excluded_tools: server.excluded_tools,
                enabled: server.enabled,
                all_bots: false,
            };

            return {
                id: server.id,
                item: {
                    kind: "mcp",
                    key: server.slug || server.name,
                    config,
                    redacted: [...headers.redacted, ...env.redacted],
                    env_keys: [...new Set(extensionEnvUses({ kind: "mcp", data: config }).sends.map((use) => use.key))],
                    notes: [],
                    documents: [],
                },
            };
        });
}