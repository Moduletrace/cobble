import type { CustomToolHttpMethods, CustomToolKind, CustomToolScriptLanguage } from "@/src/dict/custom-tool-dict";
import { SaveCustomToolRequestSchema, type SaveCustomToolRequest } from "@/src/schemas/extension-schema";
import type { CustomToolRecord } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import mergeTemplateMap from "./merge-template-map";

export type CustomToolConfigChanges = {
    method?: (typeof CustomToolHttpMethods)[number];
    url?: string;
    /**
     * Entries to set, a null removing one.
     */
    headers?: Record<string, string | null>;
    body?: string;
    timeout_ms?: number;
    language?: CustomToolScriptLanguage;
    code?: string;
    prompt?: string;
};

export type CustomToolChanges = {
    name?: string;
    description?: string;
    kind?: CustomToolKind;
    parameters?: Record<string, unknown>;
    config?: CustomToolConfigChanges;
    enabled?: boolean;
    all_bots?: boolean;
};

type Params = {
    /**
     * The tool being changed, null for a new one.
     */
    current: CustomToolRecord | null;
    changes: CustomToolChanges;
};

/**
 * A custom tool as a bot's changes would leave it: every field it leaves
 * out kept (config fields too while the kind stays), an HTTP tool's
 * headers changed entry by entry, then checked like the settings page's
 * form (`SaveCustomToolRequestSchema`).
 */
export default function mergeCustomToolChanges({ current, changes }: Params): SaveCustomToolRequest {
    const kind = changes.kind ?? current?.kind;
    const kept: Record<string, unknown> = current && current.kind == kind ? { ...current.config } : {};
    const { headers, ...config_changes } = changes.config || {};
    const config: Record<string, unknown> = { ...kept, ...config_changes };

    if (kind == "http") {
        config.headers = mergeTemplateMap({
            current: (kept.headers as Record<string, string>) || {},
            changes: headers,
        });
    }

    return parseWithSchema({
        schema: SaveCustomToolRequestSchema,
        data: {
            custom_tool_id: current?.id,
            name: changes.name ?? current?.name,
            description: changes.description ?? current?.description,
            kind,
            parameters: changes.parameters ?? current?.parameters ?? { type: "object", properties: {} },
            config,
            enabled: changes.enabled ?? current?.enabled ?? true,
            all_bots: changes.all_bots ?? current?.all_bots ?? false,
        },
    });
}
