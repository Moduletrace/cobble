import { AppData } from "@/src/data/app-data";
import composeComputerEnvFiles from "@/src/harness/tools/computer/compose-computer-env-files";
import computerWorkerAccount from "@/src/utils/computer-worker-account";
import type { ComputerRunAs } from "@/src/utils/computer-work-dirs";
import type { ComputerApi } from "./computer-fetch";
import writeComputerFile from "./write-computer-file";

type Params = {
    computer: ComputerApi;
    envs: { key: string; value: string }[];
    /**
     * A worker's run: the files go in its own account's home, where no
     * other bot on the computer can read them.
     */
    run_as?: ComputerRunAs | null;
    signal?: AbortSignal;
};

/**
 * Writes the run's env files (`~/.cobble/env` and `env.json`, owner only;
 * the agent keeps `~/.cobble` private) in the home of the account the run
 * works as (a worker's own, or gem's for the coordinator), replacing the
 * last run's, so removed envs disappear too. Returns their paths, which
 * the shell and script tools load.
 */
export default async function writeComputerEnv({ computer, envs, run_as, signal }: Params) {
    const home = run_as ? computerWorkerAccount({ bot_id: run_as.bot_id }).home : AppData.ComputerHomeDir;
    const dir = `${home}/.cobble`;
    const shell_path = `${dir}/env`;
    const json_path = `${dir}/env.json`;
    const files = composeComputerEnvFiles({ envs });

    await writeComputerFile({ computer, path: shell_path, content: files.shell, mode: 0o600, run_as, signal });
    await writeComputerFile({ computer, path: json_path, content: files.json, mode: 0o600, run_as, signal });

    return { shell_path, json_path };
}
