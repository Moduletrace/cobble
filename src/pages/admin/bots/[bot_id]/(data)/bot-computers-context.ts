import React from "react";
import type { BotComputers } from "../(hooks)/use-bot-computers";

/**
 * The open bot's computers and the switch, shared by the header's
 * computer select and the computer buttons in its messages.
 */
export const BotComputersContext = React.createContext<BotComputers>({
    computers: [],
    switchComputer: async () => {},
});
