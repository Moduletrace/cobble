import grabRunEnvs from "../extensions/grab-run-envs";
import type { EnvKeyOption } from "@/src/types";

/**
 * The general envs a remote server's headers can point at, by key, for the
 * MCP and browser forms: what `{{env.KEY}}` resolves to when no bot or
 * workspace of the run sets a better one. Never values; app settings
 * (`EnvDict`) are left out, since a template can't read them.
 */
export default async function grabGeneralEnvKeys(): Promise<EnvKeyOption[]> {
    const envs = await grabRunEnvs();

    return envs
        .map((env) => ({ key: env.key, description: env.description, secret: env.secret }))
        .sort((a, b) => a.key.localeCompare(b.key));
}