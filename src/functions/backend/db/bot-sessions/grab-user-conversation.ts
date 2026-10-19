import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabWorkspaceBot from "../workspaces/grab-workspace-bot";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * Null or undefined: the bot's own chat.
     */
    workspace_id?: number | string | null;
};

export type UserConversation = {
    bot: BUN_SQLITE_COBBLE_BOTS & { id: number };
    workspace: BUN_SQLITE_COBBLE_WORKSPACES | null;
    workspace_id: number | null;
};

/**
 * One of the user's conversations: their bot, in its own chat or in one of
 * their workspaces it works in. Throws when the bot isn't theirs or isn't
 * in that workspace.
 */
export default async function grabUserConversation({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<UserConversation> {
    if (workspace_id) {
        const found = await grabWorkspaceBot({ workspace_id, bot_id, user_id });

        if (!found?.bot.id || !found.workspace.id) {
            throw new AppError(`That bot isn't in this workspace.`);
        }

        return {
            bot: { ...found.bot, id: found.bot.id },
            workspace: found.workspace,
            workspace_id: found.workspace.id,
        };
    }

    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found`);
    }

    return { bot: { ...bot, id: bot.id }, workspace: null, workspace_id: null };
}
