import type { BUN_SQLITE_COBBLE_CONNECTORS } from "@/db/types/db";
import type { ConnectorProviderId, ConnectorStatus } from "@/src/dict/connector-dict";
import type { ConnectorRecord, McpToolInfo } from "@/src/types";
import parseJsonColumn from "../extensions/parse-json-column";

type Params = {
    row: BUN_SQLITE_COBBLE_CONNECTORS;
};

/**
 * A `connectors` row with its JSON columns read. Nothing here is secret:
 * the account is what signs in, and the key belongs to its connection row.
 */
export default function parseConnectorRow({ row }: Params): ConnectorRecord {
    return {
        id: Number(row.id),
        provider: (row.provider || "composio") as ConnectorProviderId,
        connection_id: Number(row.connection_id),
        app: row.app || "",
        name: row.name || "",
        slug: row.slug || "",
        description: row.description || "",
        logo: row.logo || "",
        auth_config_id: row.auth_config_id || null,
        scopes: parseJsonColumn<string[]>({ text: row.scopes, fallback: [] }),
        excluded_tools: parseJsonColumn<string[]>({ text: row.excluded_tools, fallback: [] }),
        tools: parseJsonColumn<McpToolInfo[]>({ text: row.tools_cache, fallback: [] }),
        all_bots: row.all_bots == 1,
        enabled: row.enabled != 0,
        status: (row.status || "untested") as ConnectorStatus,
        last_error: row.last_error || "",
        last_synced_at: typeof row.last_synced_at == "number" ? row.last_synced_at : null,
        user_id: Number(row.user_id),
    };
}