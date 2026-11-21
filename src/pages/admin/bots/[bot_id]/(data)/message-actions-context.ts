import React from "react";
import type { BotMessageReactionEmoji } from "@/src/dict/bot-dict";
import type { BotMessageWithAttachments } from "@/src/types";

/**
 * The conversation's reply and reaction handlers, shared by every
 * message's actions, and the one piece of its own state they read: whether
 * its next message goes in Plan mode.
 */
export type BotMessageActions = {
    onReply: (params: { message: BotMessageWithAttachments }) => void;
    onReact: (params: { message_id: number; emoji: BotMessageReactionEmoji }) => void;
    /**
     * A failed reply the user asked for again: queue it from its failure
     * notice.
     */
    onRetry: (params: { message: BotMessageWithAttachments }) => void;
    /**
     * A suggested next step the user clicked (`[suggestion:ID]`): put it
     * in their input, never send it.
     */
    onUseSuggestion: (params: { text: string }) => void;
    /**
     * Whether this conversation's next message is in Plan mode, which is
     * what a reply that ran in it can offer to end.
     */
    plan_mode: boolean;
    /**
     * Turn Plan mode off for this conversation and put what to say next in
     * the user's input, never send it (`PlanModeOffButton`).
     */
    onTurnOffPlanMode: () => void;
};

export const BotMessageActionsContext = React.createContext<BotMessageActions>({
    onReply: () => {},
    onReact: () => {},
    onRetry: () => {},
    onUseSuggestion: () => {},
    plan_mode: false,
    onTurnOffPlanMode: () => {},
});