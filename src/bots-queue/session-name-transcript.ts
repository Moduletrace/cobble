import type { SessionOpeningMessage } from "@/src/functions/backend/db/bot-sessions/grab-session-opening";
import { AppData } from "@/src/data/app-data";

type Params = {
    messages: SessionOpeningMessage[];
};

/**
 * A session's opening as the naming turn reads it. The summary that opens
 * a session the bot moved the conversation into is marked as the earlier
 * session's, so the title says what this one carries on with rather than
 * echoing everything the summary recaps.
 *
 * Each message is cut to `AppData.BotSessionNameMessageChars`: a pasted
 * brief of tens of thousands of characters names a session no better than
 * its first couple of paragraphs, and this is a model call like any other.
 */
export default function sessionNameTranscript({ messages }: Params) {
    return messages
        .map((message) =>
            message.carried_from_session_id
                ? `(Summary of the earlier session this one carries on from)\n${openingText({ text: message.text })}`
                : `${message.author == "user" ? "User" : "You"}: ${openingText({ text: message.text })}`,
        )
        .join("\n\n");
}

/**
 * What the naming turn reads of one message, cut at the limit with a note
 * so the model knows the opening goes on.
 */
function openingText({ text }: { text: string | null | undefined }) {
    const whole = text || "";

    if (whole.length <= AppData.BotSessionNameMessageChars) return whole || "(files only)";

    const cut = whole.slice(0, AppData.BotSessionNameMessageChars);

    return `${cut}... (the opening continues, ${whole.length.toLocaleString("en-US")} characters in all)`;
}