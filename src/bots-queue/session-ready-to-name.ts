import type { SessionOpeningMessage } from "@/src/functions/backend/db/bot-sessions/grab-session-opening";

type Params = {
    messages: SessionOpeningMessage[];
};

/**
 * Whether a session's opening says enough to name it: the bot has said
 * something of its own (a carried summary doesn't count), and, when the
 * user wrote, after the user's first message. A session with no user
 * message at all is work handed to the bot (the coordinator's delegations,
 * routines, hooks), named from the bot's own messages.
 */
export default function sessionReadyToName({ messages }: Params) {
    const has_bot_message = messages.some(
        (message) => message.author == "bot" && !message.carried_from_session_id,
    );

    if (!has_bot_message) return false;

    const first_user = messages.findIndex((message) => message.author == "user");

    if (first_user < 0) return true;

    return messages
        .slice(first_user + 1)
        .some((message) => message.author == "bot" && !message.carried_from_session_id);
}
