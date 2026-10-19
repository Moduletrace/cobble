import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabUserWorkspace from "./grab-user-workspace";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";

type Params = {
    user_id: number | string;
    workspace_id: number | string;
    bot_id: number | string;
};

/**
 * Assigns one of the user's bots to one of their workspaces. Assigning a
 * bot that is already there is a no-op.
 */
export default async function addBotToWorkspace({
    user_id,
    workspace_id,
    bot_id,
}: Params) {
    await assertCrewManager({ user_id });

    const bot = await grabUserBot({ bot_id, user_id });
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!bot?.id || !workspace?.id) {
        throw new AppError(`Bot or workspace not found.`);
    }

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO workspace_bots (workspace_id, bot_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
        values: [workspace.id, bot.id, Date.now(), Date.now()],
    });
}
