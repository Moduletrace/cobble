import grabUserConversation from "./grab-user-conversation";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * Null or undefined: the bot's own chat.
     */
    workspace_id?: number | string | null;
};

export type ReachableConversation = {
    bot_id: number;
    workspace_id: number | null;
};

/**
 * A conversation from the last-visited cookie, only while the user still
 * reaches it: `grabUserConversation` is the same access check the
 * conversation pages use, so a revoked grant, a deleted bot or an archived
 * workspace answers null and the landing page falls back instead of
 * redirecting into a page that would bounce it back.
 */
export default async function grabReachableConversation({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<ReachableConversation | null> {
    const resolved_workspace_id = workspace_id ? Number(workspace_id) : null;

    const conversation = await grabUserConversation({
        user_id,
        bot_id,
        workspace_id: resolved_workspace_id,
    }).catch(() => null);

    if (!conversation?.bot.id) return null;

    return { bot_id: conversation.bot.id, workspace_id: conversation.workspace_id };
}
