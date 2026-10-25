import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { ConversationExport } from "@/src/types";
import grabMessageRefNames from "../bots/grab-message-ref-names";
import grabMessagesMedia from "../bots/grab-messages-media";
import grabMessagesReactions from "../bots/grab-messages-reactions";
import grabMessagesReplies from "../bots/grab-messages-replies";
import mediaToAttachment from "../bots/media-to-attachment";
import grabActiveBotSession from "./grab-active-bot-session";
import grabUserConversation from "./grab-user-conversation";

type Params = {
    user_id: number | string;
    /**
     * Who the user messages are from in the copy.
     */
    user_name: string;
    bot_id: number | string;
    /**
     * The workspace the conversation is in; none for the bot's own chat.
     */
    workspace_id?: number | string | null;
};

/**
 * The session the conversation page shows (its active one), for "Copy
 * chat": every message in it, oldest first, with their attachments,
 * quotes and reactions, and the names of the bots and workspaces they
 * mention. `grabUserConversation` is the access check. Null when the
 * user can't chat with the bot there.
 */
export default async function grabConversationExport({
    user_id,
    user_name,
    bot_id,
    workspace_id,
}: Params): Promise<ConversationExport | null> {
    const conversation = await grabUserConversation({ user_id, bot_id, workspace_id }).catch(
        () => null,
    );

    if (!conversation?.bot?.id) return null;

    const session = await grabActiveBotSession({
        user_id,
        bot_id: conversation.bot.id,
        workspace_id: conversation.workspace_id,
    });

    const messages = session?.id
        ? (
              await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
                  sql: `SELECT * FROM bot_messages WHERE session_id = ? ORDER BY created_at ASC, id ASC`,
                  values: [session.id],
              })
          ).payload || []
        : [];

    const message_ids = messages.map((message) => Number(message.id));

    const [media, replies, reactions, names] = await Promise.all([
        grabMessagesMedia({ message_ids }),
        grabMessagesReplies({ message_ids }),
        grabMessagesReactions({ message_ids, user_id }),
        grabMessageRefNames({
            texts: messages.map((message) => message.text || ""),
            user_id,
        }),
    ]);

    return {
        bot_name: conversation.bot.name || "Bot",
        workspace_name: conversation.workspace?.name || null,
        user_name,
        session: session?.id
            ? {
                  id: Number(session.id),
                  title: session.title || null,
                  created_at: Number(session.created_at),
              }
            : null,
        messages: messages.map((message) => {
            const id = Number(message.id);
            const files = media.get(id);

            return {
                ...message,
                attachments: files?.map((file) => mediaToAttachment({ media: file })),
                reply_to: replies.get(id) || null,
                reactions: reactions.get(id) || [],
            };
        }),
        ref_names: {
            bots: Object.fromEntries(
                [...names.bots].map(([id, bot]) => [id, bot.name]),
            ),
            workspaces: Object.fromEntries(
                [...names.workspaces].map(([id, workspace]) => [id, workspace.name]),
            ),
        },
    };
}
