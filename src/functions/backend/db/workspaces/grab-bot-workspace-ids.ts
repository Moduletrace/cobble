import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_WORKSPACE_BOTS } from "@/db/types/db";

type Params = {
    bot_id: number | string;
};

/**
 * The workspaces a bot is a member of (`workspace_bots`), by id, regardless
 * of who is asking: a workspace's envs reach the bot's runs there, so a
 * personal secret must not shadow one (H6). The coordinator works in every
 * workspace, but its membership rows are what this reads; callers that mean
 * "every workspace" handle the coordinator themselves.
 */
export default async function grabBotWorkspaceIds({ bot_id }: Params): Promise<number[]> {
    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACE_BOTS>({
                sql: `SELECT workspace_id FROM workspace_bots WHERE bot_id = ?`,
                values: [Number(bot_id)],
            })
        ).payload || [];

    return rows.map((row) => Number(row.workspace_id));
}
