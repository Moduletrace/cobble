import { createContext } from "react";

/**
 * The id of the user's newest message in the thread, and the id of the
 * message being rendered. An ask written in a message (a take-over) is
 * waiting for them only while no user message follows it, so handing the
 * computer back - a chat message - ends the wait. Both are null outside a
 * thread, where neither is known and nothing is said to be waiting.
 */
export const LastUserMessageContext = createContext<number | null>(null);
export const MessageIdContext = createContext<number | null>(null);