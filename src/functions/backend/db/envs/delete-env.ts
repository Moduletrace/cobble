import BunSQLite from "@moduletrace/bun-sqlite";
import { clearEnvCache } from "./grab-all-envs";

type Params = {
    env_id: number;
};

/**
 * Removes an env. Computers drop it on their next run, when their env file
 * is rewritten.
 */
export default async function deleteEnv({ env_id }: Params) {
    const res = await BunSQLite.sql({
        sql: `DELETE FROM envs WHERE id = ?`,
        values: [env_id],
    });

    if (!res.success) throw new Error(`Couldn't remove the env: ${res.error}`);

    clearEnvCache();
}
