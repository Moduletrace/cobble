import { EnvDict } from "@/src/dict/env-dict";
import grabAllEnvs, { type DecryptedEnv } from "../envs/grab-all-envs";

type Params = {
    /**
     * The bot the run is for: its own envs beat everything else.
     */
    bot_id?: number | string | null;
    /**
     * The user the run is for: their personal envs for this bot beat the
     * bot's own.
     */
    user_id?: number | string | null;
    /**
     * The workspace the run is in: its envs beat general ones.
     */
    workspace_id?: number | string | null;
};

/**
 * The envs an MCP server's or custom tool's templates (`{{env.KEY}}`) read
 * on one run, one per key: the user's personal ones for this bot beat the
 * bot's own, which beat the workspace's, which beat
 * general ones. App settings (`EnvDict`) never are. Unlike computers' envs,
 * they don't have to be set on computers: the app fills them in itself.
 */
export default async function grabRunEnvs({ bot_id, user_id, workspace_id }: Params = {}): Promise<DecryptedEnv[]> {
    const app_keys = new Set(EnvDict.map((env) => env.key));
    const envs = (await grabAllEnvs()).filter((env) => !app_keys.has(env.key));
    const resolved = new Map<string, DecryptedEnv>();

    for (const env of envs.filter((e) => e.paradigm == "general")) resolved.set(env.key, env);

    if (workspace_id) {
        for (const env of envs.filter(
            (e) => e.paradigm == "workspace" && e.workspace_id == Number(workspace_id),
        )) {
            resolved.set(env.key, env);
        }
    }

    if (bot_id) {
        for (const env of envs.filter((e) => e.paradigm == "bot" && e.bot_id == Number(bot_id))) {
            resolved.set(env.key, env);
        }
    }

    if (bot_id && user_id) {
        for (const env of envs.filter(
            (e) => e.paradigm == "user" && e.bot_id == Number(bot_id) && e.user_id == Number(user_id),
        )) {
            resolved.set(env.key, env);
        }
    }

    return [...resolved.values()];
}
