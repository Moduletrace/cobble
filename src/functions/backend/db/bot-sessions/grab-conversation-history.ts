import { AppData } from "@/src/data/app-data";
import type { ConversationHistory } from "@/src/types";
import grabActiveBotTask from "../bots/grab-active-bot-task";
import grabBotMessages from "../bots/grab-bot-messages";
import ensureBotSession from "./ensure-bot-session";
import grabUserConversation from "./grab-user-conversation";
import markBotSessionRead from "./mark-bot-session-read";

type Params = {
    user_id: number;
    bot_id: number | string;
    /**
     * The workspace the conversation is in; none for the bot's own chat.
     */
    workspace_id?: number | string | null;
};

/**
 * A conversation's history, which the conversation pages load on the
 * client once they render (`api/admin/bots/conversation-history`): the
 * bot's active session there (marked read), its latest
 * `AppData.ConversationFirstMessages` messages (the thread loads older
 * ones as it scrolls) and the bot's active task in it. Everything else on
 * the page comes with it from the server (`grabConversationProps`).
 * Null when the user can't chat with the bot there.
 */
export default async function grabConversationHistory({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<ConversationHistory | null> {
    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id }).catch(
        () => null,
    );

    if (!conversation?.bot?.id) return null;

    const open_bot_id = conversation.bot.id;
    const session = await ensureBotSession({
        user_id,
        bot_id: open_bot_id,
        workspace_id: conversation.workspace_id,
    });

    if (session.unread) {
        await markBotSessionRead({ session_id: session.id!, user_id });
        session.unread = 0;
    }

    const [messages, task] = await Promise.all([
        grabBotMessages({
            session_id: session.id!,
            user_id,
            limit: AppData.ConversationFirstMessages + 1,
        }),
        grabActiveBotTask({ bot_id: open_bot_id, session_id: session.id }),
    ]);

    const has_more = messages.length > AppData.ConversationFirstMessages;

    return {
        session,
        messages: has_more ? messages.slice(1) : messages,
        has_more,
        task,
    };
}
