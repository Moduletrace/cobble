import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Throws unless the user manages this bot's MCP servers and tools: super
 * admins and admins, the super admin alone for the coordinator. Returns
 * the bot.
 */
export default async function assertBotExtensionManager({ user_id, bot_id }: Params) {
    const role = await grabCrewRole({ user_id });
    const bot = (
        await BunSQLite.sql<{ id: number; kind: string; name: string }>({
            sql: `SELECT id, kind, name FROM bots WHERE id = ?`,
            values: [bot_id],
        })
    ).payload?.[0];

    if (!bot) throw new AppError(`That bot doesn't exist.`);

    if (role == "member" || (bot.kind == "coordinator" && role != "super_admin")) {
        throw new AppError(`Only an admin can change a bot's tools.`);
    }

    return bot;
}
