import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotExtensionsPayload } from "@/src/types";
import grabCrewRole from "../access/grab-crew-role";
import grabExtensionsOverview from "./grab-extensions-overview";

type Params = {
    /**
     * Who's looking: only super admins and admins (the super admin alone
     * for the coordinator) get what can be added.
     */
    user_id: number | string;
    bot_id: number | string;
    /**
     * The workspace the bot is seen in: its MCP servers, tools and skills show
     * too, not removable from the bot.
     */
    workspace_id?: number | string | null;
};

/**
 * A bot's MCP servers, tools and skills (given to it, and its workspace's there),
 * and the rest of them, which can be added.
 */
export default async function grabBotExtensionsOverview({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<BotExtensionsPayload> {
    const [role, bot] = await Promise.all([
        grabCrewRole({ user_id }),
        BunSQLite.sql<{ kind: string }>({ sql: `SELECT kind FROM bots WHERE id = ?`, values: [bot_id] }),
    ]);

    return grabExtensionsOverview({
        can_manage: role == "super_admin" || (role == "admin" && bot.payload?.[0]?.kind != "coordinator"),
        bot_id,
        workspace_id,
    });
}
