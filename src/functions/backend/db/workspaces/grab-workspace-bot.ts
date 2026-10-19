import type {
    BUN_SQLITE_COBBLE_BOTS,
    BUN_SQLITE_COBBLE_WORKSPACE_BOTS,
    BUN_SQLITE_COBBLE_WORKSPACES,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import workspaceBotsSql from "@/src/utils/crew-access/workspace-bots-sql";
import workspacesSql from "@/src/utils/crew-access/workspaces-sql";
import grabCrewRole from "../access/grab-crew-role";

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
 * A bot the user chats with in a workspace they're in (not archived): one
 * of its workers, or for the super admin the coordinator, which is in all
 * of them (`workspaceBotsSql`). Null otherwise.
 */
export default async function grabWorkspaceBot({
    workspace_id,
    bot_id,
    user_id,
}: Params): Promise<WorkspaceBotMembership | null> {
    const role = await grabCrewRole({ user_id });
    const workspace_access = workspacesSql({ role, user_id });

    const workspace = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT w.* FROM workspaces w WHERE w.id = ? AND w.archived = 0 AND ${workspace_access.sql} LIMIT 1`,
            values: [workspace_id, ...workspace_access.values],
        })
    ).payload?.[0];

    if (!workspace?.id) return null;

    const bot_access = workspaceBotsSql({ role, workspace_id: workspace.id });

    const bot = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT b.* FROM bots b WHERE b.id = ? AND ${bot_access.sql} LIMIT 1`,
            values: [bot_id, ...bot_access.values],
        })
    ).payload?.[0];

    if (!bot?.id) return null;

    const membership =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACE_BOTS>({
                sql: `SELECT * FROM workspace_bots WHERE workspace_id = ? AND bot_id = ? LIMIT 1`,
                values: [workspace.id, bot.id],
            })
        ).payload?.[0] || null;

    return { workspace, bot, membership };
}
