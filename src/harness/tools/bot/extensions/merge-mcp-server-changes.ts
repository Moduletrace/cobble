import { SaveMcpServerRequestSchema, type SaveMcpServerRequest } from "@/src/schemas/extension-schema";
import type { McpServerRecord } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import mergeTemplateMap from "./merge-template-map";

export type McpServerChanges = {
    name?: string;
    description?: string;
    url?: string;
    /**
     * Entries to set, a null removing one.
     */
    headers?: Record<string, string | null>;
    excluded_tools?: string[];
    enabled?: boolean;
    all_bots?: boolean;
};

type Params = {
    /**
     * The server being changed, null for a new one.
     */
    current: McpServerRecord | null;
    changes: McpServerChanges;
};

/**
 * A remote MCP server as a bot's changes would leave it: every field it
 * leaves out kept, headers changed entry by entry, then checked like the
 * settings page's form (`SaveMcpServerRequestSchema`). A stdio server runs
 * a command in the app's container, so a bot never builds one.
 */
export default function mergeMcpServerChanges({ current, changes }: Params): SaveMcpServerRequest {
    if (current?.transport == "stdio" && (changes.url !== undefined || changes.headers !== undefined)) {
        throw new AppError(
            `${current.name} runs a command here (stdio): how it starts is changed by the user in Settings, under MCPs.`,
        );
    }

    return parseWithSchema({
        schema: SaveMcpServerRequestSchema,
        data: {
            mcp_server_id: current?.id,
            name: changes.name ?? current?.name,
            description: changes.description ?? current?.description ?? "",
            transport: current?.transport ?? "remote",
            url: changes.url ?? current?.url ?? "",
            headers: mergeTemplateMap({ current: current?.headers || {}, changes: changes.headers }),
            command: current?.command ?? "",
            setup_command: current?.setup_command ?? "",
            env: current?.env ?? {},
            excluded_tools: changes.excluded_tools ?? current?.excluded_tools ?? [],
            enabled: changes.enabled ?? current?.enabled ?? true,
            all_bots: changes.all_bots ?? current?.all_bots ?? false,
        },
    });
}
