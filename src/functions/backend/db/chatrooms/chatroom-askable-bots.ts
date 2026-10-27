import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabCrewWorkers from "../bots/grab-crew-workers";
import grabUserBot from "../bots/grab-user-bot";

type Params = {
    /**
     * The user the room works for: only bots they reach can be asked.
     */
    user_id: number | string;
    /**
     * The bot asking, never asked itself.
     */
    requester_bot_id: number | string;
    /**
     * In a workspace, only its members can be asked.
     */
    workspace_id?: number | string | null;
};

/**
 * The workers a bot may have asked through the coordinator for a user:
 * in a workspace its members, otherwise every worker the user reaches.
 * Read fresh each time, so a bot that left or lost the user's grant is
 * never asked.
 */
export default async function chatroomAskableBots({
    user_id,
    requester_bot_id,
    workspace_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS[]> {
    const workers = (await grabCrewWorkers({ workspace_id: workspace_id || null })).filter(
        (bot) => bot.id != Number(requester_bot_id),
    );

    const reached = await Promise.all(
        workers.map(async (bot) => ((await grabUserBot({ bot_id: bot.id!, user_id }))?.id ? bot : null)),
    );

    return reached.filter((bot): bot is BUN_SQLITE_COBBLE_BOTS => Boolean(bot));
}
