import type {
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_WORKSPACE_BOTS,
    BUN_SQLITE_COBBLE_WORKSPACES,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    workspace_id: number | string;
    bot_id: number | string;
    user_id: number | string;
};

export type WorkspaceBotMembership = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
    bot: BUN_SQLITE_COBBLE_BOTS;
    /**
     * Its `workspace_bots` row. Null for the coordinator, which works in
     * every workspace without one until it's given instructions there.
     */
    membership: BUN_SQLITE_COBBLE_WORKSPACE_BOTS | null;
};

/**
 * One of the user's bots in one of their (non-archived) workspaces: a
 * member, or the coordinator, which is in all of them. Null otherwise.
 */
export default async function grabWorkspaceBot({
    workspace_id,
    bot_id,
    user_id,
}: Params): Promise<WorkspaceBotMembership | null> {
    const workspace = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT * FROM workspaces WHERE id = ? AND user_id = ? AND archived = 0 LIMIT 1`,
            values: [workspace_id, user_id],
        })
    ).payload?.[0];

    const bot = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT * FROM bots WHERE id = ? AND user_id = ? LIMIT 1`,
            values: [bot_id, user_id],
        })
    ).payload?.[0];

    if (!workspace?.id || !bot?.id) return null;

    const membership =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACE_BOTS>({
                sql: `SELECT * FROM workspace_bots WHERE workspace_id = ? AND bot_id = ? LIMIT 1`,
                values: [workspace.id, bot.id],
            })
        ).payload?.[0] || null;

    if (!membership && bot.kind != "coordinator") return null;

    return { workspace, bot, membership };
}
