import type { BUN_SQLITE_COBBLE_BROWSERS } from "@/db/types/db";
import type { McpServerStatus } from "@/src/dict/mcp-dict";
import type { BrowserRecord, McpToolInfo } from "@/src/types";
import parseJsonColumn from "../extensions/parse-json-column";

type Params = {
    row: BUN_SQLITE_COBBLE_BROWSERS;
};

/**
 * A `browsers` row with its JSON columns read. Headers stay encrypted:
 * only `openBotBrowsers` and the connection test decrypt them.
 */
export default function parseBrowserRow({ row }: Params): BrowserRecord {
    return {
        id: Number(row.id),
        user_id: Number(row.user_id),
        name: row.name || "",
        slug: row.slug || "",
        description: row.description || "",
        url: row.url || "",
        has_headers: Boolean(row.headers),
        excluded_tools: parseJsonColumn<string[]>({ text: row.excluded_tools, fallback: [] }),
        tools: parseJsonColumn<McpToolInfo[]>({ text: row.tools_cache, fallback: [] }),
        enabled: row.enabled != 0,
        allow_routines: row.allow_routines == 1,
        status: (row.status || "untested") as McpServerStatus,
        last_error: row.last_error || "",
        last_synced_at: typeof row.last_synced_at == "number" ? row.last_synced_at : null,
    };
}
