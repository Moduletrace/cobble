import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import isCrewMessage from "./is-crew-message";

type Params = {
    /**
     * The message the user asked to run again, read as it is.
     */
    message?: Pick<
        BUN_SQLITE_COBBLE_BOT_MESSAGES,
        "id" | "author" | "from_ask_id" | "from_install_request_id"
    > | null;
    /**
     * The session's newest message from the bot itself, if any (`null` when
     * the bot has none, since it never runs a reply that isn't there).
     */
    last_bot_id?: number | string | null;
    /**
     * The session's newest message, whatever it is.
     */
    last_message_id?: number | string | null;
    /**
     * The session's status.
     */
    session_status?: string | null;
    /**
     * A reply job still pending or working in the session, if any.
     */
    open_reply_id?: number | string | null;
    /**
     * The session's newest user message, if any.
     */
    latest_user_id?: number | string | null;
};

/**
 * Why a message can't be answered again, or null when it can. The action is
 * offered on the last word the bot had in the conversation, whatever it was
 * (an answer, a stopped run's notice, a failure notice), and on the user's
 * own message when nothing followed it: a run that was stopped or pruned
 * leaves their message waiting with nothing on its way, and running it again
 * is how they ask for it. A run again answers the newest user message
 * afresh, so it needs one, and it never starts beside a reply already on its
 * way.
 */
export default function rerunReplyProblem({
    message,
    last_bot_id,
    last_message_id,
    session_status,
    open_reply_id,
    latest_user_id,
}: Params): string | null {
    if (!message) {
        return `Only a message in this conversation can be run again.`;
    }

    if (message.author == "user") {
        if (!last_message_id || Number(last_message_id) != Number(message.id)) {
            return `Only the last message can be answered again.`;
        }
    } else if (message.author != "bot" || isCrewMessage({ message })) {
        return `Only the bot's own reply can be run again.`;
    } else if (!last_bot_id || Number(last_bot_id) != Number(message.id)) {
        return `Only the last reply can be run again.`;
    }

    if (session_status != "active") {
        return `This conversation has moved on.`;
    }

    if (open_reply_id) {
        return `A reply is already on its way.`;
    }

    if (!latest_user_id) {
        return `There is nothing to reply to.`;
    }

    return null;
}