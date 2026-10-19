import grabAllEnvs from "./grab-all-envs";

type Params = {
    key: string;
};

/**
 * An app setting (an `EnvDict` key): the general value set in Settings,
 * else the process environment, else undefined.
 */
export default async function grabEnv({ key }: Params) {
    const saved = (await grabAllEnvs()).find(
        (env) => env.paradigm == "general" && env.key == key,
    );

    return saved?.value || process.env[key] || undefined;
}
