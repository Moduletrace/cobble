import React from "react";
import type { StopBot } from "../(hooks)/use-stop-bot";

export type StopBotState = StopBot & {
    /**
     * The bot has something open for the signed-in user right now (a reply
     * it owes, a task it's on, a wait for a model or a computer), so
     * stopping it has something to pull the plug on.
     */
    can_stop: boolean;
};

/**
 * The conversation's stop control, shared by the thinking row under the
 * thread and the header's menu, so both pull the same plug.
 */
export const StopBotContext = React.createContext<StopBotState>({
    stop: async () => {},
    stopping: false,
    can_stop: false,
});
