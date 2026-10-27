import { AppData } from "@/src/data/app-data";
import type { ConversationHistory } from "@/src/types";
import grabActiveBotTask from "../bots/grab-active-bot-task";
import grabBotMessages from "../bots/grab-bot-messages";
import ensureBotSession from "./ensure-bot-session";
import grabCarriedToSessionId from "./grab-carried-to-session-id";
import reopenBotSession from "./reopen-bot-session";
import grabUserBotSession from "./grab-user-bot-session";
import grabUserConversation from "./grab-user-conversation";
import markBotSessionRead from "./mark-bot-session-read";

type Params = {
    user_id: number;
    bot_id: number | string;
    /**
     * The workspace the conversation is in; none for the bot's own chat.
     */
    workspace_id?: number | string | null;
    /**
     * A session of the conversation to show instead of the active one
     * (the page's `?session_id=`). One that isn't the user's, or is in
     * another conversation, is ignored.
     */
    session_id?: number | string | null;
};

/**
 * A conversation's history, which the conversation pages load on the
 * client once they render (`api/admin/bots/conversation-history`): the
 * bot's active session there, or the one asked for (marked read; a closed
 * one is reopened, unless it was carried over, which only shows, with
 * where the conversation went on), its latest
 * `AppData.ConversationFirstMessages` messages (the thread loads older
 * ones as it scrolls) and the bot's active task in it. Everything else on
 * the page comes with it from the server (`grabConversationProps`).
 * Null when the user can't chat with the bot there.
 */
export default async function grabConversationHistory({
    user_id,
    bot_id,
    workspace_id,
    session_id,
}: Params): Promise<ConversationHistory | null> {
    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id }).catch(
        () => null,
    );

    if (!conversation?.bot?.id) return null;

    const open_bot_id = conversation.bot.id;
    const conversation_workspace_id = conversation.workspace_id || null;

    const asked = session_id
        ? await grabUserBotSession({ session_id, user_id })
        : null;

    const in_conversation =
        asked?.id &&
        !asked.chatroom_id &&
        Number(asked.bot_id) == Number(open_bot_id) &&
        (asked.workspace_id ? Number(asked.workspace_id) : null) ==
            (conversation_workspace_id ? Number(conversation_workspace_id) : null);

    /**
     * A closed session asked for is reopened, as clicking it in a list
     * does, unless it was carried over into a newer one: that one only
     * shows, with the way to where the conversation went on.
     */
    const carried_to =
        in_conversation && asked.status != "active"
            ? await grabCarriedToSessionId({ session_id: asked.id!, user_id })
            : null;

    const session = !in_conversation
        ? await ensureBotSession({
              user_id,
              bot_id: open_bot_id,
              workspace_id: conversation.workspace_id,
          })
        : asked.status == "active" || carried_to
          ? asked
          : await reopenBotSession({ session_id: asked.id!, user_id });

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
        moved_to_session_id: carried_to,
    };
}
