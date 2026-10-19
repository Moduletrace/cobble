import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_WORKSPACE_BOTS } from "@/db/types/db";
import type { WorkspaceBot } from "@/src/types";
import grabBots from "../bots/grab-bots";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
};

/**
 * A workspace's crew (the coordinator first, then its bots by latest
 * activity there), each with its instructions and memory for the
 * workspace.
 */
export default async function grabWorkspaceBots({
    user_id,
    workspace_id,
}: Params): Promise<WorkspaceBot[]> {
    const [bots, rows] = await Promise.all([
        grabBots({ user_id, workspace_id }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACE_BOTS>({
            sql: `SELECT bot_id, system_prompt, memory FROM workspace_bots WHERE workspace_id = ?`,
            values: [workspace_id],
        }).then((res) => res.payload || []),
    ]);

    return bots.map((bot) => {
        const row = rows.find((r) => r.bot_id == bot.id);

        return {
            ...bot,
            workspace_system_prompt: row?.system_prompt || null,
            workspace_memory: row?.memory || null,
        };
    });
}
