import React from "react";
import type { BotComputers } from "../(hooks)/use-bot-computers";

/**
 * The open bot's computers, the switch and the viewer, shared by the
 * header's computers modal and the computer buttons in its messages.
 */
export const BotComputersContext = React.createContext<BotComputers>({
    computers: [],
    switchComputer: async () => {},
    openComputer: () => {},
    closeComputer: () => {},
});
