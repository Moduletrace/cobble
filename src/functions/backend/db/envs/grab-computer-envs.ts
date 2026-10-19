import BunSQLite from "@moduletrace/bun-sqlite";
import grabAllEnvs from "./grab-all-envs";
import resolveScopedEnvs from "./resolve-scoped-envs";

type Params = {
    computer_id: number | string;
    /**
     * The bot using the computer. Only workspaces it shares with the
     * computer apply; without a bot, every workspace the computer is in.
     */
    bot_id?: number | string;
};

/**
 * The envs a run on this computer gets (`resolveScopedEnvs`). Workspaces
 * are non-archived ones, oldest first, so the oldest wins a tie.
 */
export default async function grabComputerEnvs({ computer_id, bot_id }: Params) {
    const workspaces =
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT w.id FROM workspaces w
                    JOIN workspace_computers wc ON wc.workspace_id = w.id AND wc.computer_id = ?
                    WHERE w.archived = 0
                    ${bot_id ? `AND w.id IN (SELECT workspace_id FROM workspace_bots WHERE bot_id = ?)` : ""}
                    ORDER BY w.id ASC`,
                values: bot_id ? [computer_id, bot_id] : [computer_id],
            })
        ).payload || [];

    return resolveScopedEnvs({
        envs: await grabAllEnvs(),
        computer_id: Number(computer_id),
        workspace_ids: workspaces.map((workspace) => Number(workspace.id)),
    });
}
