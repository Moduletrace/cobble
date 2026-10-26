import type { SessionOpeningMessage } from "@/src/functions/backend/db/bot-sessions/grab-session-opening";

type Params = {
    messages: SessionOpeningMessage[];
};

/**
 * A session's opening as the naming turn reads it. The summary that opens
 * a session the bot moved the conversation into is marked as the earlier
 * session's, so the title says what this one carries on with rather than
 * echoing everything the summary recaps.
 */
export default function sessionNameTranscript({ messages }: Params) {
    return messages
        .map((message) =>
            message.carried_from_session_id
                ? `(Summary of the earlier session this one carries on from)\n${message.text || ""}`
                : `${message.author == "user" ? "User" : "You"}: ${message.text || "(files only)"}`,
        )
        .join("\n\n");
}
