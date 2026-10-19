import type { CustomToolRecord } from "@/src/types";
import redactSecrets from "@/src/utils/redact-secrets";
import type { HarnessTool } from "../../types";
import checkRequiredArgs from "./check-required-args";
import runHttpTool from "./run-http-tool";
import runPromptTool from "./run-prompt-tool";
import runScriptTool from "./run-script-tool";

type Params = {
    tool: CustomToolRecord;
    /**
     * What `{{env.KEY}}` reads (`grabRunEnvs`). Secret values are blanked
     * out of every result and error.
     */
    envs: { key: string; value: string; secret: boolean }[];
    /**
     * Where a script tool runs. Without one, a script tool isn't offered.
     */
    computer_id?: number | string | null;
    bot_id?: number | string;
    workspace_id?: number | string | null;
};

/**
 * A custom tool as a harness tool: its name, description and JSON schema
 * as the model sees them, and `run` dispatching on its kind (an HTTP
 * request, a script on the computer, or a prompt). Null for a script tool
 * when the run has no computer.
 */
export default function buildCustomTool({
    tool,
    envs,
    computer_id,
    bot_id,
    workspace_id,
}: Params): HarnessTool<Record<string, unknown>> | null {
    if (tool.kind == "script" && !computer_id) return null;

    const secrets = envs.filter((env) => env.secret);
    const redact = (text: string) => redactSecrets({ text, secrets });

    const call = ({ args, signal }: { args: Record<string, unknown>; signal: AbortSignal }) => {
        switch (tool.kind) {
            case "http":
                return runHttpTool({ config: tool.config, args, envs, signal });
            case "script":
                return runScriptTool({ config: tool.config, args, computer_id: computer_id!, workspace_id, signal });
            case "prompt":
                return runPromptTool({ config: tool.config, args, envs, bot_id, workspace_id, signal });
        }
    };

    return {
        name: tool.name,
        description:
            tool.kind == "script"
                ? `${tool.description}\n(Runs on your current computer.)`
                : tool.description,
        parameters: tool.parameters,
        run: async ({ args, signal }) => {
            try {
                checkRequiredArgs({ parameters: tool.parameters, args });
                return redact(await call({ args, signal }));
            } catch (error: unknown) {
                if (error instanceof Error) error.message = redact(error.message);
                throw error;
            }
        },
    };
}
