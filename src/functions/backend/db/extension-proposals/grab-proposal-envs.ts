import BunSQLite from "@moduletrace/bun-sqlite";
import { EnvDict } from "@/src/dict/env-dict";
import type { ExtensionProposalEnv } from "@/src/types";
import type { ExtensionEnvUse } from "@/src/utils/extension-env-uses";
import grabAllEnvs from "../envs/grab-all-envs";

type Params = {
    sends: ExtensionEnvUse[];
};

/**
 * Each env a proposed server or tool sends, with where it's saved: the
 * scopes templates read (`grabRunEnvs`: general, a bot's own, a
 * workspace's), named. App settings never fill a template, so one of
 * those keys reads as missing.
 */
export default async function grabProposalEnvs({ sends }: Params): Promise<ExtensionProposalEnv[]> {
    const app_keys = new Set(EnvDict.map((env) => env.key));
    const envs = (await grabAllEnvs()).filter(
        (env) => !app_keys.has(env.key) && ["general", "bot", "workspace"].includes(env.paradigm),
    );

    const bot_ids = [...new Set(envs.map((env) => env.bot_id).filter(Boolean))];
    const workspace_ids = [...new Set(envs.map((env) => env.workspace_id).filter(Boolean))];
    const [bots, workspaces] = await Promise.all([
        names({ table: "bots", ids: bot_ids as number[] }),
        names({ table: "workspaces", ids: workspace_ids as number[] }),
    ]);

    return sends.map((use) => ({
        ...use,
        saved_in: envs
            .filter((env) => env.key == use.key)
            .map((env) =>
                env.paradigm == "general"
                    ? "general"
                    : env.paradigm == "bot"
                      ? `bot ${bots.get(Number(env.bot_id)) || env.bot_id} only`
                      : `workspace ${workspaces.get(Number(env.workspace_id)) || env.workspace_id} only`,
            ),
    }));
}

async function names({ table, ids }: { table: "bots" | "workspaces"; ids: number[] }) {
    if (!ids.length) return new Map<number, string>();

    const rows = await BunSQLite.sql<{ id: number; name: string }>({
        sql: `SELECT id, name FROM ${table} WHERE id IN (${ids.map(() => "?").join(", ")})`,
        values: ids,
    });

    return new Map((rows.payload || []).map((row) => [Number(row.id), row.name || ""]));
}
