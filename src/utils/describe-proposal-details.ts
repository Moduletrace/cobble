import type { SaveCustomToolRequest, SaveMcpServerRequest } from "@/src/schemas/extension-schema";
import type { ExtensionProposalDetail } from "@/src/types";

type Params = (
    | { kind: "mcp"; data: SaveMcpServerRequest }
    | { kind: "tool"; data: SaveCustomToolRequest }
) & {
    /**
     * A new one rather than a change: no bot gets it until it's given.
     */
    is_new: boolean;
};

/**
 * What a proposed MCP server or tool would do, line by line, read from the
 * config the confirm button saves, so the card shows exactly what would
 * be saved rather than the bot's account of it.
 */
export default function describeProposalDetails(params: Params): ExtensionProposalDetail[] {
    const { data } = params;
    const common: ExtensionProposalDetail[] = [
        { label: "Name", value: data.name },
        { label: "Description", value: data.description || "none" },
    ];
    const reach: ExtensionProposalDetail[] = [
        { label: "Starts", value: data.enabled ? "On" : "Off" },
        {
            label: "Who gets it",
            value: data.all_bots ? "Every bot, now and new" : params.is_new ? "No bot until it's given to some" : "As it is now",
        },
    ];

    if (params.kind == "mcp") {
        return [
            ...common,
            { label: "URL", value: params.data.url },
            { label: "Headers", value: listMap({ map: params.data.headers }), block: true },
            { label: "Left-out tools", value: params.data.excluded_tools.join(", ") || "none" },
            ...reach,
        ];
    }

    const tool = params.data;
    const parameters: ExtensionProposalDetail = {
        label: "Arguments",
        value: JSON.stringify(tool.parameters, null, 2),
        block: true,
    };

    if (tool.kind == "http") {
        return [
            ...common,
            { label: "Kind", value: "HTTP request, sent by the app" },
            { label: "Request", value: `${tool.config.method} ${tool.config.url}` },
            { label: "Headers", value: listMap({ map: tool.config.headers }), block: true },
            { label: "Body", value: tool.config.body || "none: the arguments go as JSON", block: Boolean(tool.config.body) },
            parameters,
            ...reach,
        ];
    }

    if (tool.kind == "script") {
        return [
            ...common,
            {
                label: "Kind",
                value: `${tool.config.language} script, run on the bot's computer, where it reads every env shared with computers`,
            },
            { label: "Code", value: tool.config.code, block: true },
            parameters,
            ...reach,
        ];
    }

    return [
        ...common,
        { label: "Kind", value: "Prompt, one turn with the bot's models" },
        { label: "Prompt", value: tool.config.prompt, block: true },
        parameters,
        ...reach,
    ];
}

function listMap({ map }: { map: Record<string, string> }) {
    const entries = Object.entries(map);

    return entries.length ? entries.map(([key, value]) => `${key}: ${value}`).join("\n") : "none";
}
