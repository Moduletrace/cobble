import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_WORKSPACES,
} from "@/db/types/db";
import { EnvDict } from "@/src/dict/env-dict";
import type { EnvsOverviewPayload } from "@/src/types";
import grabAllEnvs from "./grab-all-envs";

type Params = {
    user_id: number;
};

/**
 * The Environment settings page: where envs can be set (general, the
 * user's workspaces and computers), every env (secret values left out),
 * and the app settings with where each comes from.
 */
export default async function grabEnvsOverview({
    user_id,
}: Params): Promise<EnvsOverviewPayload> {
    const [workspaces, computers, envs] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT id, name, archived FROM workspaces WHERE user_id = ? ORDER BY archived ASC, id ASC`,
            values: [user_id],
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
            sql: `SELECT id, name, kind FROM computers WHERE user_id = ? ORDER BY kind = 'main' DESC, id ASC`,
            values: [user_id],
        }),
        grabAllEnvs(),
    ]);

    const workspace_ids = new Set((workspaces.payload || []).map((w) => Number(w.id)));
    const computer_ids = new Set((computers.payload || []).map((c) => Number(c.id)));
    const known_keys = new Set(EnvDict.map((env) => env.key));

    const visible = envs.filter(
        (env) =>
            env.paradigm == "general" ||
            (env.workspace_id !== null && workspace_ids.has(env.workspace_id)) ||
            (env.computer_id !== null && computer_ids.has(env.computer_id)),
    );

    return {
        scopes: [
            { paradigm: "general", id: null, title: "General" },
            ...(workspaces.payload || []).map((workspace) => ({
                paradigm: "workspace" as const,
                id: Number(workspace.id),
                title: `Workspace: ${workspace.name}${workspace.archived ? " (archived)" : ""}`,
            })),
            ...(computers.payload || []).map((computer) => ({
                paradigm: "computer" as const,
                id: Number(computer.id),
                title: `Computer: ${computer.name || computer.kind}`,
            })),
        ],
        envs: visible.map((env) => ({
            id: env.id,
            key: env.key,
            description: env.description,
            paradigm: env.paradigm,
            workspace_id: env.workspace_id,
            computer_id: env.computer_id,
            secret: env.secret,
            expose_to_computers: env.expose_to_computers,
            value: env.secret ? undefined : env.value,
            known: known_keys.has(env.key),
        })),
        known: EnvDict.map((env) => ({
            ...env,
            saved: envs.some((saved) => saved.paradigm == "general" && saved.key == env.key),
            from_process: Boolean(process.env[env.key]),
        })),
    };
}
