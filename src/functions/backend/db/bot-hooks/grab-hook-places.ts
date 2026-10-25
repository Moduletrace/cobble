import type { HookPlace } from "@/src/types";
import AppError from "@/src/utils/app-error";
import grabChatBot from "../bots/grab-chat-bot";
import grabBotById from "../bots/grab-bot-by-id";
import grabBotWorkspaces from "../workspaces/grab-bot-workspaces";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Where the user can give a bot a hook, for the hook form: its own chat,
 * when they chat with it there, then its workspaces they're in. Throws
 * when they reach it nowhere.
 */
export default async function grabHookPlaces({ user_id, bot_id }: Params): Promise<HookPlace[]> {
    const bot = await grabBotById({ bot_id });
    const places: HookPlace[] = [];

    if (bot?.id && (await grabChatBot({ bot_id: bot.id, user_id }))?.id) {
        places.push({ workspace_id: null, name: `${bot.name || "The bot"}'s own chat` });
    }

    for (const workspace of bot?.id ? await grabBotWorkspaces({ user_id, bot }) : []) {
        places.push({ workspace_id: Number(workspace.id), name: workspace.name || `Workspace ${workspace.id}` });
    }

    if (!places.length) {
        throw new AppError(`Bot not found`);
    }

    return places;
}
