import { AppData } from "@/src/data/app-data";
import { CustomToolScriptLanguages } from "@/src/dict/custom-tool-dict";
import grabComputerMcpUrl from "@/src/functions/backend/db/computers/grab-computer-mcp-url";
import grabComputerEnvs from "@/src/functions/backend/db/envs/grab-computer-envs";
import type { CustomToolScriptConfig } from "@/src/types";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import redactSecrets from "@/src/utils/redact-secrets";
import computerDirsShell from "../computer/computer-dirs-shell";
import runComputerCommand from "../computer/run-computer-command";
import writeComputerEnv from "../computer/write-computer-env";

type Params = {
    config: CustomToolScriptConfig;
    args: Record<string, unknown>;
    computer_id: number | string;
    /**
     * The bot the run is for: its own envs beat everything.
     */
    bot_id?: number | string | null;
    /**
     * The workspace the run is in: its envs apply on the computer.
     */
    workspace_id?: number | string | null;
    /**
     * The run's folders on the computer (`computerRunDirs`): the script
     * runs in the user's. A try from the settings page has no bot, so it
     * runs at the workspace's root.
     */
    dirs?: ComputerRunDirs | null;
    signal: AbortSignal;
};

/**
 * Runs the tool's code on a computer over the sandbox's REST API, with the
 * computer's envs set (`writeComputerEnv`) and the arguments as JSON in
 * `COBBLE_ARGS` and on stdin. Code and arguments travel base64-encoded,
 * so nothing in them needs quoting. It runs in the run's own folder
 * (`computerDirsShell`). Returns what it printed (stdout and
 * stderr), secrets redacted; a non-zero exit throws with it.
 */
export default async function runScriptTool({
    config,
    args,
    computer_id,
    bot_id,
    workspace_id,
    dirs,
    signal,
}: Params) {
    const target = await grabComputerMcpUrl({ computer_id });

    if (!target) throw new Error(`Computer #${computer_id} has no container to run on.`);
    if (!target.ready) throw new Error(computerNotReadyMessage(target));

    const envs = await grabComputerEnvs({ computer_id, bot_id, workspace_id });
    const { shell_path } = await writeComputerEnv({ base_url: target.base_url, envs, signal });
    const language =
        CustomToolScriptLanguages.find((l) => l.value == config.language) || CustomToolScriptLanguages[0];

    const code = Buffer.from(config.code || "").toString("base64");
    const input = Buffer.from(JSON.stringify(args)).toString("base64");

    const result = await runComputerCommand({
        base_url: target.base_url,
        /**
         * In a subshell: `exit` in the sandbox's own shell would end its
         * session.
         */
        command: `(${[
            `f=$(mktemp --suffix=.${language.extension})`,
            `echo ${code} | base64 -d > "$f"`,
            `[ -f ${shell_path} ] && . ${shell_path}`,
            dirs ? computerDirsShell({ dirs }).replace(/; $/, "") : `cd ${AppData.ComputerWorkspaceDir}`,
            `export COBBLE_ARGS="$(echo ${input} | base64 -d)"`,
            `printf '%s' "$COBBLE_ARGS" | ${language.interpreter} "$f" 2>&1`,
            `status=$?`,
            `rm -f "$f"`,
            `exit $status`,
        ].join("; ")})`,
        timeout_ms: Math.min(config.timeout_ms || AppData.CustomToolDefaultTimeoutMs, AppData.CustomToolMaxTimeoutMs),
        signal,
    });

    const output = redactSecrets({
        text: result.output.trim(),
        secrets: envs.filter((env) => env.secret),
    });

    if (result.exit_code) {
        throw new Error(`Exit code ${result.exit_code}${output ? `:\n${output}` : "."}`);
    }

    return output || "(no output)";
}
