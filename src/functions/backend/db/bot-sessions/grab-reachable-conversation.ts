import grabUserConversation from "./grab-user-conversation";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

export type ReachableConversation = {
    bot_id: number;
};

/**
 * The bot's own chat from the last-visited cookie, only while the user still
 * reaches it: `grabUserConversation` is the same access check the
 * conversation pages use, so a revoked grant or a deleted bot answers null
 * and the landing page falls back instead of redirecting into a page that
 * would bounce it back.
 */
export default async function grabReachableConversation({
    user_id,
    bot_id,
}: Params): Promise<ReachableConversation | null> {
    const conversation = await grabUserConversation({
        user_id,
        bot_id,
        workspace_id: null,
    }).catch(() => null);

    if (!conversation?.bot.id) return null;

    return { bot_id: conversation.bot.id };
}
