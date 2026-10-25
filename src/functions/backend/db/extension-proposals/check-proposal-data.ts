import type { SaveCustomToolRequest, SaveMcpServerRequest } from "@/src/schemas/extension-schema";
import AppError from "@/src/utils/app-error";
import hasEnvTemplate from "@/src/utils/has-env-template";
import literalUrlHost from "@/src/utils/literal-url-host";

type Params =
    | { kind: "mcp"; data: SaveMcpServerRequest }
    | { kind: "tool"; data: SaveCustomToolRequest };

/**
 * Throws for what a bot may never propose, checked when it proposes and
 * again on confirm: a stdio server (a command in the app's container), a
 * URL whose host a template decides (where a key goes must be readable,
 * and a bot must not pick it per call), and envs in a prompt tool (the
 * model's answer would carry the secret back past redaction).
 */
export default function checkProposalData(params: Params) {
    if (params.kind == "mcp") {
        if (params.data.transport != "remote") {
            throw new AppError(`Only remote MCP servers can be proposed. A stdio one is added by the user in Settings, under MCPs.`);
        }

        if (!literalUrlHost({ url: params.data.url })) {
            throw new AppError(`The URL's host has to be written out (https://host/...), with no template in it.`);
        }

        return;
    }

    const tool = params.data;

    if (tool.kind == "http" && !literalUrlHost({ url: tool.config.url })) {
        throw new AppError(`The URL's host has to be written out (https://host/...), with no template in it.`);
    }

    if (tool.kind == "prompt" && hasEnvTemplate({ values: [tool.config.prompt] })) {
        throw new AppError(`A prompt tool can't read envs: the model's answer would carry the value back.`);
    }
}
