import { z } from "zod";
import pushToSessionUser from "@/src/bots-queue/push-to-session-user";
import {
    BotMessageReactions,
    type BotMessageReactionEmoji,
} from "@/src/dict/bot-dict";
import addBotMessageReaction from "@/src/functions/backend/db/bots/add-bot-message-reaction";
import grabLatestUserMessage from "@/src/functions/backend/db/bots/grab-latest-user-message";
import grabSessionMessage from "@/src/functions/backend/db/bots/grab-session-message";
import type { HarnessTool } from "../../types";

type Params = {
    bot_id: number | string;
    /**
     * The user whose conversation it is.
     */
    user_id: number | string;
    /**
     * The session being answered: the reaction goes to a message in it,
     * and the user's open conversation sees it live.
     */
    session_id: number | string;
};

type Args = {
    emoji: BotMessageReactionEmoji;
    message_id?: number;
};

const ReactionEmojis = BotMessageReactions.map((reaction) => reaction.value) as [
    BotMessageReactionEmoji,
    ...BotMessageReactionEmoji[],
];

const EmojiList = BotMessageReactions.map(
    (reaction) => `${reaction.value} (${reaction.title.toLowerCase()})`,
).join(", ");

/**
 * Lets a bot react to a message in the conversation it's answering. With
 * no message id it reacts to the user's latest message, the one a reply is
 * usually about. The reaction shows under the message and reaches the
 * user's open conversation at once.
 */
export default function reactToMessageTool({ bot_id, user_id, session_id }: Params): HarnessTool<Args> {
    return {
        name: "react_to_message",
        description: `React to a message in this conversation with an emoji (${EmojiList}). Use it when a reaction says it better than words, or when the user asks you to react. It doesn't replace answering. Without message_id it reacts to the user's latest message.`,
        schema: z.object({
            emoji: z.enum(ReactionEmojis).describe(`One of: ${EmojiList}`),
            message_id: z
                .number()
                .int()
                .positive()
                .optional()
                .describe(`The message to react to; defaults to the user's latest message`),
        }),
        run: async ({ args }) => {
            const message = args.message_id
                ? await grabSessionMessage({
                      session_id,
                      message_id: args.message_id,
                  })
                : await grabLatestUserMessage({ session_id });

            if (!message?.id) {
                throw new Error(`No message to react to in this conversation.`);
            }

            const reactions = await addBotMessageReaction({
                message_id: Number(message.id),
                bot_id,
                user_id,
                emoji: args.emoji,
            });

            await pushToSessionUser({
                session_id,
                data: {
                    event: "server:bot-reaction",
                    data: { message_id: Number(message.id), reactions },
                },
            });

            return `Reacted with ${args.emoji}.`;
        },
    };
}
