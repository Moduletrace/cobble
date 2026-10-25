import type { HandOverTarget } from "@/src/types";
import grabBots from "./grab-bots";

type Params = {
    user_id: number | string;
    /**
     * Where the work runs: the bots the user chats with there, or in their
     * own chat when none.
     */
    workspace_id?: number | string | null;
    /**
     * The bot it's with now.
     */
    except_bot_id?: number | string | null;
};

/**
 * The bots a user can hand a task or routine to where it runs, for the
 * picker. Only ones already there: joining a workspace is the
 * coordinator's call, not a picker's side effect.
 */
export default async function grabHandOverTargets({ user_id, workspace_id, except_bot_id }: Params): Promise<HandOverTarget[]> {
    const bots = await grabBots({ user_id, workspace_id });

    return bots
        .filter((bot) => bot.id && bot.id != Number(except_bot_id || 0))
        .map((bot) => ({ id: Number(bot.id), name: bot.name || `Bot ${bot.id}` }));
}
