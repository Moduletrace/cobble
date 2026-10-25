import type { SaveCustomToolRequest, SaveMcpServerRequest } from "@/src/schemas/extension-schema";
import literalUrlHost from "./literal-url-host";

type Params =
    | { kind: "mcp"; data: SaveMcpServerRequest }
    | { kind: "tool"; data: SaveCustomToolRequest };

export type ExtensionEnvUse = {
    key: string;
    /**
     * Where it goes: `URL`, `body` or `header <name>`.
     */
    where: string;
};

const EnvPattern = /\{\{\s*env\.([A-Za-z0-9_.-]+)\s*\}\}/g;

/**
 * Where an MCP server or tool sends requests and which envs the app fills
 * in on the way (`fillTemplate`), read from the config itself so the
 * proposal card never depends on what a bot says about it. `host` is
 * null for a tool that sends nothing from the app (a script or a prompt)
 * or a URL whose host isn't literal.
 */
export default function extensionEnvUses(params: Params) {
    const fields: { where: string; text: string }[] = [];
    let url = "";

    if (params.kind == "mcp") {
        url = params.data.url;
        fields.push({ where: "URL", text: params.data.url });

        for (const [name, value] of Object.entries(params.data.headers)) {
            fields.push({ where: `header ${name}`, text: value });
        }
    } else if (params.data.kind == "http") {
        url = params.data.config.url;
        fields.push({ where: "URL", text: params.data.config.url });

        for (const [name, value] of Object.entries(params.data.config.headers)) {
            fields.push({ where: `header ${name}`, text: value });
        }

        fields.push({ where: "body", text: params.data.config.body });
    } else if (params.data.kind == "prompt") {
        fields.push({ where: "prompt", text: params.data.config.prompt });
    }

    const sends: ExtensionEnvUse[] = [];

    for (const field of fields) {
        for (const match of field.text.matchAll(EnvPattern)) {
            const key = match[1]!;

            if (!sends.some((use) => use.key == key && use.where == field.where)) {
                sends.push({ key, where: field.where });
            }
        }
    }

    return { host: url ? literalUrlHost({ url }) : null, sends };
}
