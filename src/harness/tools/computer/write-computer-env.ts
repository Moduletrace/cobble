import { AppData } from "@/src/data/app-data";
import composeComputerEnvFiles from "./compose-computer-env-files";

type Params = {
    /**
     * The sandbox's REST address (no `/mcp`).
     */
    base_url: string;
    envs: { key: string; value: string }[];
    signal?: AbortSignal;
};

/**
 * Writes the computer's env files (`~/.cobble/env` and `env.json`, owner
 * only), replacing the last run's, so removed envs disappear too. Returns
 * their paths for `withComputerEnv`.
 */
export default async function writeComputerEnv({ base_url, envs, signal }: Params) {
    const call = async (path: string, init?: RequestInit) => {
        const res = await fetch(`${base_url}${path}`, {
            ...init,
            headers: { "content-type": "application/json" },
            signal: AbortSignal.any([
                ...(signal ? [signal] : []),
                AbortSignal.timeout(AppData.McpConnectTimeoutMs),
            ]),
        });
        const body: any = await res.json().catch(() => ({}));

        if (!res.ok || body?.success === false) {
            throw new Error(`The computer refused ${path}: ${body?.message || res.status}`);
        }

        return body;
    };

    const context = await call(`/v1/sandbox`);
    const home = String(context.home_dir || "/root").replace(/\/+$/, "");
    const dir = `${home}/.cobble`;
    const shell_path = `${dir}/env`;
    const json_path = `${dir}/env.json`;
    const files = composeComputerEnvFiles({ envs });

    await call(`/v1/shell/exec`, {
        method: "POST",
        body: JSON.stringify({
            command: `mkdir -p ${dir} && chmod 700 ${dir} && : > ${shell_path} && : > ${json_path} && chmod 600 ${shell_path} ${json_path}`,
        }),
    });

    for (const [file, content] of [
        [shell_path, files.shell],
        [json_path, files.json],
    ] as const) {
        await call(`/v1/file/write`, {
            method: "POST",
            body: JSON.stringify({ file, content }),
        });
    }

    return { shell_path, json_path };
}
