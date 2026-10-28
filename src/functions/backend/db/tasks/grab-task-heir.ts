import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabWorkspaceAdmins from "../bot-types/grab-workspace-admins";

type Params = {
    workspace_id: number | string;
    /**
     * The bot leaving, never its own heir.
     */
    except_bot_id?: number | string | null;
};

/**
 * Who takes over a workspace task whose bot is gone: the workspace's admin
 * bot, else the coordinator. Every task belongs to a bot, so none is left
 * without one.
 */
export default async function grabTaskHeir({ workspace_id, except_bot_id }: Params) {
    const admins = await grabWorkspaceAdmins({ workspace_id });
    const admin = admins.find((bot) => Number(bot.id) != Number(except_bot_id || 0));

    if (admin?.id) return admin;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT * FROM bots WHERE kind = 'coordinator' ORDER BY id ASC LIMIT 1`,
    });

    return res.payload?.[0] || null;
}
