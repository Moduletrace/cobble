import AppError from "@/src/utils/app-error";
import deleteEnv from "./delete-env";
import grabAllEnvs from "./grab-all-envs";

type Params = {
    user_id: number | string;
    env_id: number | string;
};

/**
 * Removes one of the user's own personal secrets. Returns its key, for the
 * log. Computers drop it on their next run.
 */
export default async function deleteUserSecret({ user_id, env_id }: Params) {
    const env = (await grabAllEnvs()).find(
        (e) => e.id == Number(env_id) && e.paradigm == "user" && e.user_id == Number(user_id),
    );

    if (!env) throw new AppError(`That secret no longer exists.`);

    await deleteEnv({ env_id: env.id });

    return env.key;
}
