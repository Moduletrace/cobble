import grabRunEnvs from "../extensions/grab-run-envs";
import type { DecryptedEnv } from "./grab-all-envs";
import grabComputerEnvs from "./grab-computer-envs";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The computer the run is on (the bot's current one), whose envs count.
     */
    computer_id?: number | string | null;
};

export type ReachableEnvs = {
    /**
     * Set on the computer for its tasks ($KEY in their shells and code).
     */
    on_computer: DecryptedEnv[];
    /**
     * Only filled into tools' templates ({{env.KEY}}): not exposed to
     * computers, or there's no computer.
     */
    tools_only: DecryptedEnv[];
};

/**
 * Every env that reaches one run, one per key: the computer's
 * (`grabComputerEnvs`) first, then the ones only tools read
 * (`grabRunEnvs`). What `show_secret` can show, what `request_secret`
 * mustn't ask for again, and what a reply is told it has.
 */
export default async function grabReachableEnvs({
    bot_id,
    user_id,
    workspace_id,
    computer_id,
}: Params): Promise<ReachableEnvs> {
    const [on_computer, run] = await Promise.all([
        computer_id ? grabComputerEnvs({ computer_id, bot_id, user_id, workspace_id }) : [],
        grabRunEnvs({ bot_id, user_id, workspace_id }),
    ]);
    const keys = new Set(on_computer.map((env) => env.key));

    return { on_computer, tools_only: run.filter((env) => !keys.has(env.key)) };
}
