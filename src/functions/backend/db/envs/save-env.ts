import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_ENVS } from "@/db/types/db";
import {
    EnvDict,
    EnvKeyRegex,
    ProcessOnlyEnvKeys,
    type EnvParadigm,
} from "@/src/dict/env-dict";
import AppError from "@/src/utils/app-error";
import { encrypt } from "@/src/utils/crypt";
import { clearEnvCache } from "./grab-all-envs";

type Params = {
    /**
     * Owner of the workspace or computer the env is scoped to.
     */
    user_id: number;
    /**
     * Edits this env; adds one when not given.
     */
    env_id?: number;
    key: string;
    /**
     * Required when adding. Left out when editing, the saved value stays.
     */
    value?: string;
    description?: string;
    paradigm: EnvParadigm;
    workspace_id?: number | null;
    computer_id?: number | null;
    bot_id?: number | null;
    /**
     * The user a personal env (paradigm user, with `bot_id`) is for.
     */
    owner_user_id?: number | null;
    secret: boolean;
    expose_to_computers: boolean;
};

/**
 * Adds or edits an env. One per key and scope: SQLite unique constraints
 * treat NULL ids as distinct, so the check is here. App settings
 * (`EnvDict`) are general only, never go to computers, and keep their
 * dict's secret flag. Returns the env's id.
 */
export default async function saveEnv({
    user_id,
    env_id,
    key,
    value,
    description,
    paradigm,
    workspace_id,
    computer_id,
    bot_id,
    owner_user_id,
    secret,
    expose_to_computers,
}: Params): Promise<number> {
    const final_key = key.trim();

    if (!EnvKeyRegex.test(final_key)) {
        throw new AppError(`Use letters, digits and underscores for the key, starting with a letter or underscore.`);
    }

    if ((ProcessOnlyEnvKeys as readonly string[]).includes(final_key)) {
        throw new AppError(`${final_key} must stay in the server's environment.`);
    }

    const known = EnvDict.find((env) => env.key == final_key);

    if (known && paradigm != "general") {
        throw new AppError(`${final_key} is an app setting, so it can only be set in General.`);
    }

    const scope = await resolveScope({ user_id, paradigm, workspace_id, computer_id, bot_id, owner_user_id });

    const duplicate = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_ENVS>({
            sql: `SELECT id FROM envs WHERE key = ? AND paradigm = ?
                AND COALESCE(workspace_id, 0) = ? AND COALESCE(computer_id, 0) = ?
                AND COALESCE(bot_id, 0) = ? AND COALESCE(user_id, 0) = ?
                AND id != ? LIMIT 1`,
            values: [
                final_key,
                paradigm,
                scope.workspace_id ?? 0,
                scope.computer_id ?? 0,
                scope.bot_id ?? 0,
                scope.user_id ?? 0,
                env_id ?? 0,
            ],
        })
    ).payload?.[0];

    if (duplicate) {
        throw new AppError(`${final_key} is already set here. Edit that one instead.`);
    }

    const fields = {
        key: final_key,
        description: description?.trim() || known?.description || "",
        paradigm,
        workspace_id: scope.workspace_id,
        computer_id: scope.computer_id,
        bot_id: scope.bot_id,
        user_id: scope.user_id,
        secret: (known ? known.secret : secret) ? 1 : 0,
        expose_to_computers: !known && expose_to_computers ? 1 : 0,
    };

    if (env_id) {
        const existing = (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_ENVS>({
                sql: `SELECT id FROM envs WHERE id = ? LIMIT 1`,
                values: [env_id],
            })
        ).payload?.[0];

        if (!existing) throw new AppError(`That env no longer exists.`);

        const sets = Object.keys(fields).map((field) => `${field} = ?`);
        const values: unknown[] = Object.values(fields);

        if (value !== undefined) {
            sets.push(`value = ?`);
            values.push(await encrypt(value));
        }

        const res = await BunSQLite.sql({
            sql: `UPDATE envs SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`,
            values: [...values, Date.now(), env_id] as any[],
        });

        if (!res.success) throw new Error(`Couldn't save the env: ${res.error}`);

        clearEnvCache();

        return env_id;
    } else {
        if (value === undefined) {
            throw new AppError(`Enter a value.`);
        }

        const row = { ...fields, value: await encrypt(value) };
        const now = Date.now();

        const res = await BunSQLite.sql<{ id: number }>({
            sql: `INSERT INTO envs (created_at, updated_at, ${Object.keys(row).join(", ")})
                VALUES (?, ?, ${Object.keys(row).map(() => "?").join(", ")}) RETURNING id`,
            values: [now, now, ...Object.values(row)] as any[],
        });

        if (!res.success) throw new Error(`Couldn't save the env: ${res.error}`);

        clearEnvCache();

        return Number(res.payload?.[0]?.id);
    }
}

async function resolveScope({
    user_id,
    paradigm,
    workspace_id,
    computer_id,
    bot_id,
    owner_user_id,
}: {
    user_id: number;
    paradigm: EnvParadigm;
    workspace_id?: number | null;
    computer_id?: number | null;
    bot_id?: number | null;
    owner_user_id?: number | null;
}): Promise<{
    workspace_id: number | null;
    computer_id: number | null;
    bot_id: number | null;
    user_id: number | null;
}> {
    if (paradigm == "general") {
        return { workspace_id: null, computer_id: null, bot_id: null, user_id: null };
    }

    if (paradigm == "user") {
        if (!owner_user_id) throw new AppError(`A personal env needs its user.`);

        const scope = await resolveScope({ user_id, paradigm: "bot", bot_id });

        return { ...scope, user_id: Number(owner_user_id) };
    }

    const table =
        paradigm == "workspace" ? "workspaces" : paradigm == "bot" ? "bots" : "computers";
    const id = paradigm == "workspace" ? workspace_id : paradigm == "bot" ? bot_id : computer_id;

    const owned = id
        ? (
              await BunSQLite.sql({
                  sql: `SELECT id FROM ${table} WHERE id = ? LIMIT 1`,
                  values: [id],
              })
          ).payload?.[0]
        : undefined;

    if (!owned) {
        throw new AppError(`Pick one of the ${table}.`);
    }

    return paradigm == "workspace"
        ? { workspace_id: Number(id), computer_id: null, bot_id: null, user_id: null }
        : paradigm == "bot"
          ? { workspace_id: null, computer_id: null, bot_id: Number(id), user_id: null }
          : { workspace_id: null, computer_id: Number(id), bot_id: null, user_id: null };
}
