import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import chatBotsSql from "@/src/utils/crew-access/chat-bots-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * A bot only if the user reaches it somewhere: in its own chat
 * (`chatBotsSql`) or in a workspace they're in. Super admins and admins
 * reach every worker; only the super admin reaches the coordinator.
 */
export default async function grabUserBot({
    bot_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS | null> {
    const access = chatBotsSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT b.* FROM bots b WHERE b.id = ? AND (${access.sql} OR (b.kind != 'coordinator' AND b.id IN (
                SELECT wb.bot_id FROM workspace_bots wb
                JOIN workspace_users wu ON wu.workspace_id = wb.workspace_id AND wu.user_id = ?
                JOIN workspaces w ON w.id = wb.workspace_id AND w.archived = 0
            ))) LIMIT 1`,
        values: [bot_id, ...access.values, user_id],
    });

    return res.payload?.[0] || null;
}
