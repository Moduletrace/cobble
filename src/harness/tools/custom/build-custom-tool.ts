import recordCustomToolRun from "@/src/functions/backend/db/extensions/record-custom-tool-run";
import type { CustomToolRecord } from "@/src/types";
import redactSecrets from "@/src/utils/redact-secrets";
import type { HarnessTool } from "../../types";
import checkRequiredArgs from "./check-required-args";
import fillEnvArgs from "./fill-env-args";
import runHttpTool from "./run-http-tool";
import runPromptTool from "./run-prompt-tool";
import runScriptTool from "./run-script-tool";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";

type Params = {
    tool: CustomToolRecord;
    /**
     * What `{{env.KEY}}` reads (`grabRunEnvs`). Secret values are blanked
     * out of every result and error.
     */
    envs: { key: string; value: string; secret: boolean }[];
    /**
     * What `{{env.KEY}}` reads when the model writes it in an argument:
     * every env the run can reach on this computer, not only the ones tools
     * fill in themselves. Defaults to `envs`.
     */
    arg_envs?: { key: string; value: string; secret: boolean }[];
    /**
     * Where a script tool runs. Without one, a script tool isn't offered.
     */
    computer_id?: number | string | null;
    bot_id?: number | string;
    /**
     * The user the run is for: their personal envs for the bot apply.
     */
    user_id?: number | string | null;
    workspace_id?: number | string | null;
    /**
     * The run's folders on the computer (`computerRunDirs`), where a
     * script runs. None for a try from the settings page.
     */
    dirs?: ComputerRunDirs | null;
    /**
     * Saves how each run went on the tool. Off for a draft being tried.
     */
    record?: boolean;
};

/**
 * A custom tool as a harness tool: its name, description and JSON schema
 * as the model sees them, and `run` dispatching on its kind (an HTTP
 * request, a script on the computer, or a prompt). How each run went is
 * saved on the tool (`recordCustomToolRun`); bad arguments and cancelled
 * runs aren't the tool's fault and don't count. Null for a script tool
 * when the run has no computer.
 */
export default function buildCustomTool({
    tool,
    envs,
    arg_envs,
    computer_id,
    bot_id,
    user_id,
    workspace_id,
    dirs,
    record = true,
}: Params): HarnessTool<Record<string, unknown>> | null {
    if (tool.kind == "script" && !computer_id) return null;

    /**
     * A value filled into an argument can come back in the result (the
     * script echoes it, the server answers with it), so what fills the
     * arguments is redacted too.
     */
    const secrets = [
        ...new Map(
            [...envs, ...(arg_envs || [])].filter((env) => env.secret).map((env) => [env.key, env]),
        ).values(),
    ];
    const redact = (text: string) => redactSecrets({ text, secrets });

    /**
     * A prompt tool's filled text IS the model's input, so a secret fills in
     * there as its `[KEY]` marker, never its value (`runPromptTool` does the
     * same for the prompt itself). HTTP and script tools get the value: it
     * stays in the request or the script, where the model never sees it.
     */
    const arg_values = (arg_envs || envs).map((env) =>
        tool.kind == "prompt" && env.secret ? { ...env, value: `[${env.key}]` } : env,
    );

    const call = ({ args, signal }: { args: Record<string, unknown>; signal: AbortSignal }) => {
        switch (tool.kind) {
            case "http":
                return runHttpTool({ config: tool.config, args, envs, signal });
            case "script":
                return runScriptTool({
                    config: tool.config,
                    args,
                    computer_id: computer_id!,
                    bot_id,
                    user_id,
                    workspace_id,
                    dirs,
                    signal,
                });
            case "prompt":
                return runPromptTool({ config: tool.config, args, envs, bot_id, workspace_id, signal });
        }
    };

    /**
     * The arguments as the model sent them, with `{{env.KEY}}` filled in:
     * the run is told that is how a tool reads an env, so an argument that
     * holds one is a template, not a literal string.
     */
    const filledArgs = ({ args }: { args: Record<string, unknown> }) =>
        fillEnvArgs({ value: args, envs: arg_values }) as Record<string, unknown>;

    return {
        name: tool.name,
        description:
            tool.kind == "script"
                ? `${tool.description}\n(Runs on your current computer.)`
                : tool.description,
        parameters: tool.parameters,
        run: async ({ args, signal }) => {
            checkRequiredArgs({ parameters: tool.parameters, args });

            try {
                const result = redact(await call({ args: filledArgs({ args }), signal }));
                if (record) await recordCustomToolRun({ custom_tool_id: tool.id });
                return result;
            } catch (error: unknown) {
                if (error instanceof Error) error.message = redact(error.message);

                if (record && !signal.aborted) {
                    await recordCustomToolRun({
                        custom_tool_id: tool.id,
                        error: error instanceof Error ? error.message : redact(String(error)),
                    });
                }

                throw error;
            }
        },
    };
}
