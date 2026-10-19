import { EnvDict } from "@/src/dict/env-dict";
import type { DecryptedEnv } from "./grab-all-envs";

type Params = {
    envs: DecryptedEnv[];
    computer_id: number;
    /**
     * The workspaces whose envs apply, in order of precedence (first wins).
     */
    workspace_ids: number[];
};

/**
 * The envs that reach one computer, one per key: its own beat its
 * workspaces' (the first listed workspace wins a tie), which beat general
 * ones. Only envs exposed to computers; app settings never are.
 */
export default function resolveScopedEnvs({
    envs,
    computer_id,
    workspace_ids,
}: Params): DecryptedEnv[] {
    const app_keys = new Set(EnvDict.map((env) => env.key));
    const exposed = envs.filter(
        (env) => env.expose_to_computers && !app_keys.has(env.key),
    );
    const resolved = new Map<string, DecryptedEnv>();

    const layers = [
        exposed.filter((env) => env.paradigm == "general"),
        ...[...workspace_ids].reverse().map((id) =>
            exposed.filter((env) => env.paradigm == "workspace" && env.workspace_id == id),
        ),
        exposed.filter((env) => env.paradigm == "computer" && env.computer_id == computer_id),
    ];

    for (const layer of layers) {
        for (const env of layer) resolved.set(env.key, env);
    }

    return [...resolved.values()].sort((a, b) => a.key.localeCompare(b.key));
}
