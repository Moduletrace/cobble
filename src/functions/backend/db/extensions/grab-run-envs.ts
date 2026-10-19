import { EnvDict } from "@/src/dict/env-dict";
import grabAllEnvs, { type DecryptedEnv } from "../envs/grab-all-envs";

type Params = {
    /**
     * The workspace the run is in: its envs beat general ones.
     */
    workspace_id?: number | string | null;
};

/**
 * The envs an MCP server's or custom tool's templates (`{{env.KEY}}`) read
 * on one run, one per key: the workspace's beat general ones. App settings
 * (`EnvDict`) never are. Unlike computers' envs, they don't have to be set
 * on computers: the app fills them in itself.
 */
export default async function grabRunEnvs({ workspace_id }: Params = {}): Promise<DecryptedEnv[]> {
    const app_keys = new Set(EnvDict.map((env) => env.key));
    const envs = (await grabAllEnvs()).filter((env) => !app_keys.has(env.key));
    const resolved = new Map<string, DecryptedEnv>();

    for (const env of envs.filter((e) => e.paradigm == "general")) resolved.set(env.key, env);

    if (workspace_id) {
        for (const env of envs.filter((e) => e.paradigm == "workspace" && e.workspace_id == Number(workspace_id))) {
            resolved.set(env.key, env);
        }
    }

    return [...resolved.values()];
}
