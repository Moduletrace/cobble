import React from "react";
import type { BotWithLastMessage } from "@/src/types";

/**
 * The live crew the conversation sees (the workspace's in a workspace),
 * so a bot named in a message links to it, even one created just now.
 */
export const CrewBotsContext = React.createContext<BotWithLastMessage[]>([]);
