type Params = {
    envs: { key: string; value: string }[];
};

/**
 * A computer's env files: `shell` for bash (`export KEY='value'`, single
 * quotes escaped) and `json` for code runners.
 */
export default function composeComputerEnvFiles({ envs }: Params) {
    const shell = envs
        .map((env) => `export ${env.key}='${env.value.replaceAll("'", `'\\''`)}'`)
        .join("\n");

    return {
        shell: shell ? `${shell}\n` : "",
        json: JSON.stringify(Object.fromEntries(envs.map((env) => [env.key, env.value]))),
    };
}
