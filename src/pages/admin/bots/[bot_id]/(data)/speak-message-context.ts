import React from "react";
import type { SpeakMessage } from "../(hooks)/use-speak-message";

/**
 * The conversation's read-aloud, shared by every bot message's play
 * button.
 */
export const SpeakMessageContext = React.createContext<SpeakMessage>({
    enabled: false,
    message_id: null,
    state: "idle",
    toggle: () => {},
});
