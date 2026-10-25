import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import botCanTarget from "@/src/utils/rbac/bot-can-target";
import grabCrewWorkers from "../bots/grab-crew-workers";
import grabBotTypes from "./grab-bot-types";
import grabBotsTypes from "./grab-bots-types";

type Params = {
    /**
     * The bot handing out the work.
     */
    bot_id: number | string;
    workspace_id: number | string;
};

/**
 * The bots in a workspace that a bot may direct there (hand a task to, set
 * instructions for): read fresh, so a member added mid-run is there, and
 * filtered through `BotTypeTargetMatrix` (`botCanTarget`), never itself.
 */
export default async function grabDirectableBots({ bot_id, workspace_id }: Params): Promise<BUN_SQLITE_COBBLE_BOTS[]> {
    const members = (await grabCrewWorkers({ workspace_id })).filter((bot) => bot.id != Number(bot_id));

    if (!members.length) return [];

    const actor_bot_types = await grabBotTypes({ bot_id });
    const types = await grabBotsTypes({ bot_ids: members.map((bot) => bot.id) });

    return members.filter((bot) =>
        botCanTarget({
            actor_bot_types,
            target_bot_types: types.get(Number(bot.id)) || [],
            workspace_id,
        }),
    );
}
