import React from "react";
import type { ChatroomSummary } from "@/src/types";

/**
 * The requests the bot asked from this conversation, kept live, so the
 * thread can show the open ones and its messages can offer a retry.
 */
export const ConversationChatroomsContext = React.createContext<ChatroomSummary[]>([]);
