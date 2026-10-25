import { EnvDict } from "@/src/dict/env-dict";
import type { DecryptedEnv } from "./grab-all-envs";

type Params = {
    envs: DecryptedEnv[];
    /**
     * The bot the run is for: its own envs beat everything else.
     */
    bot_id?: number | string | null;
    /**
     * The user the run is for: their personal envs for this bot beat the
     * bot's own.
     */
    user_id?: number | string | null;
    computer_id?: number | string | null;
    /**
     * The workspaces whose envs apply, in order of precedence (first wins).
     */
    workspace_ids?: (number | string)[];
};

/**
 * The envs that reach one run, one per key: the user's personal ones for
 * this bot beat the bot's own, which beat the
 * computer's, which beat its workspaces' (the first listed workspace wins
 * a tie), which beat general ones. Only envs exposed to computers; app
 * settings never are.
 */
export default function resolveScopedEnvs({
    envs,
    bot_id,
    user_id,
    computer_id,
    workspace_ids = [],
}: Params): DecryptedEnv[] {
    const app_keys = new Set(EnvDict.map((env) => env.key));
    const exposed = envs.filter(
        (env) => env.expose_to_computers && !app_keys.has(env.key),
    );
    const resolved = new Map<string, DecryptedEnv>();

    const layers = [
        exposed.filter((env) => env.paradigm == "general"),
        ...[...workspace_ids].reverse().map((id) =>
            exposed.filter(
                (env) => env.paradigm == "workspace" && env.workspace_id == Number(id),
            ),
        ),
        computer_id
            ? exposed.filter(
                  (env) => env.paradigm == "computer" && env.computer_id == Number(computer_id),
              )
            : [],
        bot_id
            ? exposed.filter((env) => env.paradigm == "bot" && env.bot_id == Number(bot_id))
            : [],
        bot_id && user_id
            ? exposed.filter(
                  (env) =>
                      env.paradigm == "user" &&
                      env.bot_id == Number(bot_id) &&
                      env.user_id == Number(user_id),
              )
            : [],
    ];

    for (const layer of layers) {
        for (const env of layer) resolved.set(env.key, env);
    }

    return [...resolved.values()].sort((a, b) => a.key.localeCompare(b.key));
}
