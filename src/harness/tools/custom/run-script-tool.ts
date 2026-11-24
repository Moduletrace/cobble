import { AppData } from "@/src/data/app-data";
import { CustomToolScriptLanguages } from "@/src/dict/custom-tool-dict";
import grabComputerTarget from "@/src/functions/backend/db/computers/grab-computer-target";
import grabComputerEnvs from "@/src/functions/backend/db/envs/grab-computer-envs";
import type { CustomToolScriptConfig } from "@/src/types";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import { sshRunDirs, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import ensureSshHome from "@/src/functions/backend/computers/ssh/ensure-ssh-home";
import redactSecrets from "@/src/utils/redact-secrets";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import writeComputerEnv from "@/src/functions/backend/computers/write-computer-env";
import computerDirsShell from "../computer/computer-dirs-shell";

type Params = {
    config: CustomToolScriptConfig;
    args: Record<string, unknown>;
    computer_id: number | string;
    /**
     * The bot the run is for: its own envs beat everything.
     */
    bot_id?: number | string | null;
    /**
     * The user the run is for: their personal envs for the bot apply.
     */
    user_id?: number | string | null;
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
 * Runs the tool's code on a computer over its agent's shell API, with the
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
    user_id,
    workspace_id,
    dirs,
    signal,
}: Params) {
    const target = await grabComputerTarget({ computer_id });

    if (!target) throw new Error(`Computer #${computer_id} has no container or server to run on.`);
    if (!target.ready) throw new Error(computerNotReadyMessage(target));

    const effectiveDirs = target.connection === "ssh"
        ? sshRunDirs({ home: await ensureSshHome({ computer: target, signal }), bot_id: bot_id || 0, user_id: user_id || 0 })
        : dirs;

    const envs = await grabComputerEnvs({ computer_id, bot_id, user_id, workspace_id });
    /**
     * A bot's run works as its own account there (the coordinator's as
     * the computer's user); a try from the settings page has none.
     */
    const run_as = target.connection === "ssh" ? null : effectiveDirs?.run_as || null;
    const { shell_path } = await writeComputerEnv({ computer: target, envs, run_as, bot_id, signal });
    const language =
        CustomToolScriptLanguages.find((l) => l.value == config.language) || CustomToolScriptLanguages[0];

    const code = Buffer.from(config.code || "").toString("base64");
    const input = Buffer.from(JSON.stringify(args)).toString("base64");

    const result = await runComputerCommand({
        computer: target,
        command: `(${[
            `f=$(mktemp --suffix=.${language.extension})`,
            `echo ${code} | base64 -d > "$f"`,
            `[ -f ${shell_path} ] && . ${shell_path}`,
            effectiveDirs ? computerDirsShell({ dirs: effectiveDirs }).replace(/; $/, "") : `cd ${AppData.ComputerWorkspaceDir}`,
            `export COBBLE_ARGS="$(echo ${input} | base64 -d)"`,
            `printf '%s' "$COBBLE_ARGS" | ${language.interpreter} "$f" 2>&1`,
            `status=$?`,
            `rm -f "$f"`,
            `exit $status`,
        ].join("; ")})`,
        timeout_ms: Math.min(config.timeout_ms || AppData.CustomToolDefaultTimeoutMs, AppData.CustomToolMaxTimeoutMs),
        run_as,
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
