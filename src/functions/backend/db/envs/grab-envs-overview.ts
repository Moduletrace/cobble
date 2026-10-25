import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_COMPUTERS,
    BUN_SQLITE_COBBLE_WORKSPACES,
} from "@/db/types/db";
import { EnvDict } from "@/src/dict/env-dict";
import type { EnvsOverviewPayload } from "@/src/types";
import grabAllEnvs, { type DecryptedEnv } from "./grab-all-envs";
import grabPersonalSecrets from "./grab-personal-secrets";

type Params = {
    /**
     * The super admin looking: workspaces, computers and bots belong to
     * the install, so they see every one.
     */
    user_id: number;
};

/**
 * The Environment settings page: where envs can be set (general, every
 * workspace, bot and computer), every env (secret values left out),
 * the app settings with where each comes from, and every user's personal
 * secrets (set from the chat, listed apart, values never shown).
 */
export default async function grabEnvsOverview(_params: Params): Promise<EnvsOverviewPayload> {
    const [workspaces, bots, computers, envs, personal] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT id, name, archived FROM workspaces ORDER BY archived ASC, id ASC`,
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT id, name, kind FROM bots ORDER BY kind = 'coordinator' DESC, id ASC`,
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
            sql: `SELECT id, name, kind FROM computers ORDER BY kind = 'main' DESC, id ASC`,
        }),
        grabAllEnvs(),
        grabPersonalSecrets(),
    ]);

    const known_keys = new Set(EnvDict.map((env) => env.key));

    return {
        scopes: [
            { paradigm: "general", id: null, title: "General" },
            ...[
                ...(workspaces.payload || []).map((workspace) => ({
                    paradigm: "workspace" as const,
                    id: Number(workspace.id),
                    title: `Workspace: ${workspace.name}${workspace.archived ? " (archived)" : ""}`,
                })),
                ...(bots.payload || []).map((bot) => ({
                    paradigm: "bot" as const,
                    id: Number(bot.id),
                    title: `Bot: ${bot.name || bot.kind}`,
                })),
                ...(computers.payload || []).map((computer) => ({
                    paradigm: "computer" as const,
                    id: Number(computer.id),
                    title: `Computer: ${computer.name || computer.kind}`,
                })),
            ].sort(compareScopes),
        ],
        envs: envs.filter((env) => env.paradigm != "user").map((env) => publicEnv({ env, known_keys })),
        personal,
        known: EnvDict.map((env) => ({
            ...env,
            saved: envs.some((saved) => saved.paradigm == "general" && saved.key == env.key),
            from_process: Boolean(process.env[env.key]),
        })),
    };
}

/**
 * As the page lists them, secret values left out.
 */
export function publicEnv({
    env,
    known_keys,
}: {
    env: DecryptedEnv;
    known_keys: Set<string>;
}) {
    return {
        id: env.id,
        key: env.key,
        description: env.description,
        paradigm: env.paradigm,
        workspace_id: env.workspace_id,
        computer_id: env.computer_id,
        bot_id: env.bot_id,
        secret: env.secret,
        expose_to_computers: env.expose_to_computers,
        value: env.secret ? undefined : env.value,
        known: known_keys.has(env.key),
    };
}

const ScopeOrder = ["workspace", "bot", "computer"];

/**
 * Groups the scopes by paradigm (workspaces, then bots, then computers),
 * each in id order.
 */
function compareScopes(a: { paradigm: string; id: number | null }, b: { paradigm: string; id: number | null }) {
    return (
        ScopeOrder.indexOf(a.paradigm) - ScopeOrder.indexOf(b.paradigm) ||
        Number(a.id || 0) - Number(b.id || 0)
    );
}
