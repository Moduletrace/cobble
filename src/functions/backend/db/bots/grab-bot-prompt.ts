import composeBotPrompt from "@/src/utils/compose-bot-prompt";
import AppError from "@/src/utils/app-error";
import grabSystemPromptAppend from "../app-settings/grab-system-prompt-append";
import grabWorkspaceBot from "../workspaces/grab-workspace-bot";
import grabBotUserMemory from "./grab-bot-user-memory";
import grabUserBot from "./grab-user-bot";

type Params = {
    bot_id: number | string;
    /**
     * The user the bot works with: only their memory joins the prompt.
     */
    user_id: number | string;
    /**
     * The workspace the bot is working in. Its context and the bot's
     * instructions and memory there join the prompt.
     */
    workspace_id?: number | string | null;
};

/**
 * The full prompt for one of the user's bots (`composeBotPrompt`): its
 * core instructions, the install-wide appendix, its memory, what it
 * remembers about this user, and in a workspace that workspace's context
 * and what the bot has for it.
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
        appendix: await grabSystemPromptAppend(),
        memory: bot.memory,
        user_memory: await grabBotUserMemory({ bot_id: bot.id, user_id }),
        workspace: found?.workspace,
        workspace_bot: found?.membership,
    });
}
