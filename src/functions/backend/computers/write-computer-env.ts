import { AppData } from "@/src/data/app-data";
import composeComputerEnvFiles from "@/src/harness/tools/computer/compose-computer-env-files";
import type { ComputerApi } from "./computer-fetch";
import writeComputerFile from "./write-computer-file";

type Params = {
    computer: ComputerApi;
    envs: { key: string; value: string }[];
    signal?: AbortSignal;
};

/**
 * Writes the computer's env files (`~/.cobble/env` and `env.json`, owner
 * only; the agent keeps `~/.cobble` private), replacing the last run's, so
 * removed envs disappear too. Returns their paths, which the shell and
 * script tools load.
 */
export default async function writeComputerEnv({ computer, envs, signal }: Params) {
    const dir = `${AppData.ComputerHomeDir}/.cobble`;
    const shell_path = `${dir}/env`;
    const json_path = `${dir}/env.json`;
    const files = composeComputerEnvFiles({ envs });

    await writeComputerFile({ computer, path: shell_path, content: files.shell, mode: 0o600, signal });
    await writeComputerFile({ computer, path: json_path, content: files.json, mode: 0o600, signal });

    return { shell_path, json_path };
}
