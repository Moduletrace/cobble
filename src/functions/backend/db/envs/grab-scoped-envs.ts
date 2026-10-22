import { EnvDict, type EnvParadigm } from "@/src/dict/env-dict";
import type { ScopedEnvsPayload } from "@/src/types";
import grabUserBot from "../bots/grab-user-bot";
import grabUserWorkspace from "../workspaces/grab-user-workspace";
import grabAllEnvs from "./grab-all-envs";
import { publicEnv } from "./grab-envs-overview";

type Params = {
    paradigm: Extract<EnvParadigm, "workspace" | "bot">;
    owner_id: number | string;
    /**
     * Who's looking. Envs are super admin only, like the Environment page;
     * everyone else gets `null`, so the group isn't rendered at all.
     */
    user_id: number | string;
    /**
     * Whether they're a super admin.
     */
    can_manage: boolean;
};

/**
 * One bot's or workspace's own envs, for its settings page: only what's
 * set there, never the whole install's.
 */
export default async function grabScopedEnvs({
    paradigm,
    owner_id,
    user_id,
    can_manage,
}: Params): Promise<ScopedEnvsPayload | null> {
    if (!can_manage) return null;

    const owner =
        paradigm == "bot"
            ? await grabUserBot({ bot_id: owner_id, user_id })
            : await grabUserWorkspace({ workspace_id: owner_id, user_id });

    if (!owner?.id) return null;

    const known_keys = new Set(EnvDict.map((env) => env.key));

    const envs = (await grabAllEnvs()).filter((env) =>
        paradigm == "bot"
            ? env.paradigm == "bot" && env.bot_id == Number(owner_id)
            : env.paradigm == "workspace" && env.workspace_id == Number(owner_id),
    );

    return {
        scope: {
            paradigm,
            id: Number(owner_id),
            title: paradigm == "bot" ? "Bot" : "Workspace",
        },
        envs: envs.map((env) => publicEnv({ env, known_keys })),
        can_manage,
    };
}
