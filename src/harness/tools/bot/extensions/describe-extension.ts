import type { CustomToolRecord, McpServerRecord, SkillRecord } from "@/src/types";
import describeExtensionAccess from "./describe-extension-access";
import describeTemplateMap from "./describe-template-map";

type Access = {
    bot_ids: number[];
    workspace_ids: number[];
};

type Params = Access &
    (
        | { kind: "skill"; item: SkillRecord }
        | { kind: "mcp"; item: McpServerRecord }
        | { kind: "tool"; item: CustomToolRecord }
    ) & {
        /**
         * Everything needed to edit it (the runbook, how a server is
         * reached, a tool's arguments and config), not just its line.
         */
        full?: boolean;
    };

/**
 * One skill, MCP server or tool as the coordinator reads it: a line with
 * its id, name, state and who gets it, and with `full` the rest of it.
 */
export default function describeExtension(params: Params) {
    const access = describeExtensionAccess({ all_bots: params.item.all_bots, ...params });
    const state = params.item.enabled ? "on" : "off";

    if (params.kind == "skill") {
        const { item } = params;
        const line = `skill #${item.id} "${item.name}" (slug ${item.slug}, ${state}): ${item.description}. Gets it: ${access}.`;

        return params.full ? `${line}\n\nRunbook:\n${item.body}` : line;
    }

    if (params.kind == "mcp") {
        const { item } = params;
        const status = item.status == "error" ? `error: ${item.last_error}` : item.status;
        const line = `MCP server #${item.id} "${item.name}" (slug ${item.slug}, ${item.transport}, ${state}, ${status}, ${item.tools.length} tools): ${item.description || "no description"}. Gets it: ${access}.`;

        if (!params.full) return line;

        const reach =
            item.transport == "remote"
                ? [`URL: ${item.url}`, `Headers: ${describeTemplateMap({ map: item.headers })}`]
                : [
                      `Command: ${item.command}`,
                      `Setup command: ${item.setup_command || "none"}`,
                      `Env: ${describeTemplateMap({ map: item.env })}`,
                  ];

        return [
            line,
            ...reach,
            `Left out tools: ${item.excluded_tools.join(", ") || "none"}`,
            `Tools: ${item.tools.map((tool) => tool.name).join(", ") || "none listed yet"}`,
        ].join("\n");
    }

    const { item } = params;
    const status = item.status == "error" ? `last run failed: ${item.last_error}` : item.status;
    const line = `tool #${item.id} ${item.name} (${item.kind}, ${state}, ${status}): ${item.description}. Gets it: ${access}.`;

    if (!params.full) return line;

    const config =
        item.kind == "http"
            ? { ...item.config, headers: describeTemplateMap({ map: item.config.headers || {} }) }
            : item.config;

    return [
        line,
        `Arguments schema: ${JSON.stringify(item.parameters)}`,
        `Config: ${JSON.stringify(config)}`,
    ].join("\n");
}
