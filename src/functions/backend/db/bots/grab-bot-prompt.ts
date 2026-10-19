import composeBotPrompt from "@/src/utils/compose-bot-prompt";
import AppError from "@/src/utils/app-error";
import grabWorkspaceBot from "../workspaces/grab-workspace-bot";
import grabUserBot from "./grab-user-bot";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    /**
     * The workspace the bot is working in. Its context and the bot's
     * instructions and memory there join the prompt.
     */
    workspace_id?: number | string | null;
};

/**
 * The full prompt for one of the user's bots (`composeBotPrompt`): its
 * core instructions and memory, and in a workspace that workspace's
 * context and what the bot has for it.
 */
export default async function grabBotPrompt({ bot_id, user_id, workspace_id }: Params) {
    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    const found = workspace_id
        ? await grabWorkspaceBot({ workspace_id, bot_id: bot.id, user_id })
        : null;

    if (workspace_id && !found) {
        throw new AppError(`${bot.name || "This bot"} isn't in that workspace.`);
    }

    return composeBotPrompt({
        system_prompt: bot.system_prompt,
        memory: bot.memory,
        workspace: found?.workspace,
        workspace_bot: found?.membership,
    });
}
