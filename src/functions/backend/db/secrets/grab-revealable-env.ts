import canRevealEnv from "@/src/utils/rbac/can-reveal-env";
import AppError from "@/src/utils/app-error";
import grabCrewRole from "../access/grab-crew-role";
import grabUserBot from "../bots/grab-user-bot";
import grabAllEnvs from "../envs/grab-all-envs";

type Params = {
    env_id: number | string;
    user_id: number | string;
};

/**
 * An env a secret ref (`[secret:ID]`) names, with whether this viewer may
 * reveal it (`canRevealEnv`). Someone else's personal secret reads as
 * missing: not even its key is shown to anyone else.
 */
export default async function grabRevealableEnv({ env_id, user_id }: Params) {
    const env = (await grabAllEnvs()).find((e) => e.id == Number(env_id));

    if (!env || (env.paradigm == "user" && env.user_id != Number(user_id))) {
        throw new AppError(`That secret isn't yours or no longer exists.`);
    }

    const role = await grabCrewRole({ user_id });
    const reaches_bot =
        env.paradigm == "user" && env.bot_id ? Boolean((await grabUserBot({ bot_id: env.bot_id, user_id }))?.id) : false;

    return { env, can_reveal: canRevealEnv({ env, viewer_id: user_id, role, reaches_bot }) };
}
