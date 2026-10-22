import BunSQLite from "@moduletrace/bun-sqlite";
import grabAllEnvs from "./grab-all-envs";
import resolveScopedEnvs from "./resolve-scoped-envs";

type Params = {
    computer_id: number | string;
    /**
     * The bot the run is for: its own envs beat everything else.
     */
    bot_id?: number | string | null;
    /**
     * The workspace the run is in. Its envs apply when the computer is
     * linked to it (and it isn't archived); outside a workspace only the
     * computer's own and general envs do.
     */
    workspace_id?: number | string | null;
};

/**
 * The envs a run on this computer gets (`resolveScopedEnvs`).
 */
export default async function grabComputerEnvs({ computer_id, bot_id, workspace_id }: Params) {
    const linked = workspace_id
        ? (
              await BunSQLite.sql<{ id: number }>({
                  sql: `SELECT w.id FROM workspaces w
                    JOIN workspace_computers wc ON wc.workspace_id = w.id AND wc.computer_id = ?
                    WHERE w.id = ? AND w.archived = 0 LIMIT 1`,
                  values: [computer_id, workspace_id],
              })
          ).payload?.[0]
        : null;

    return resolveScopedEnvs({
        envs: await grabAllEnvs(),
        bot_id,
        computer_id: Number(computer_id),
        workspace_ids: linked?.id ? [Number(linked.id)] : [],
    });
}
