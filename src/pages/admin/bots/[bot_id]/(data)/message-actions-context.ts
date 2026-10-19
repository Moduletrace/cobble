import React from "react";
import type { BotMessageReactionEmoji } from "@/src/dict/bot-dict";
import type { BotMessageWithAttachments } from "@/src/types";

/**
 * The conversation's reply and reaction handlers, shared by every
 * message's actions.
 */
export type BotMessageActions = {
    onReply: (params: { message: BotMessageWithAttachments }) => void;
    onReact: (params: { message_id: number; emoji: BotMessageReactionEmoji }) => void;
};

export const BotMessageActionsContext = React.createContext<BotMessageActions>({
    onReply: () => {},
    onReact: () => {},
});
