import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_ENVS } from "@/db/types/db";
import type { EnvParadigm } from "@/src/dict/env-dict";
import { decrypt } from "@/src/utils/crypt";

export type DecryptedEnv = {
    id: number;
    key: string;
    value: string;
    description: string;
    paradigm: EnvParadigm;
    workspace_id: number | null;
    computer_id: number | null;
    bot_id: number | null;
    secret: boolean;
    expose_to_computers: boolean;
};

let cache: Promise<DecryptedEnv[]> | undefined;

/**
 * Every env, decrypted, cached in this process until `clearEnvCache` (every
 * save and delete calls it). A value that can't be decrypted (the
 * encryption key changed) reads as empty.
 */
export default function grabAllEnvs(): Promise<DecryptedEnv[]> {
    cache ||= load().catch((error) => {
        cache = undefined;
        throw error;
    });

    return cache;
}

export function clearEnvCache() {
    cache = undefined;
}

async function load() {
    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_ENVS>({
                sql: `SELECT * FROM envs ORDER BY id ASC`,
            })
        ).payload || [];

    return await Promise.all(
        rows.map(async (row): Promise<DecryptedEnv> => ({
            id: Number(row.id),
            key: row.key || "",
            value: row.value ? await decrypt(row.value).catch(() => "") : "",
            description: row.description || "",
            paradigm: (row.paradigm || "general") as EnvParadigm,
            workspace_id: typeof row.workspace_id == "number" ? row.workspace_id : null,
            computer_id: typeof row.computer_id == "number" ? row.computer_id : null,
            bot_id: typeof row.bot_id == "number" ? row.bot_id : null,
            secret: row.secret != 0,
            expose_to_computers: row.expose_to_computers != 0,
        })),
    );
}
