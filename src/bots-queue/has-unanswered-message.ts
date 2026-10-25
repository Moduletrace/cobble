import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

type Params = {
    /**
     * The session's latest messages, oldest first.
     */
    history: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "id" | "author">[];
    /**
     * The newest user message a finished reply answered
     * (`grabAnsweredMessageId`), null when none is on record.
     */
    answered_id: number | null;
};

/**
 * Whether a reply has anything left to answer. A user message that came in
 * while the last reply ran is saved before that reply, so the thread ends
 * with the bot's message even though the bot never read it: what the last
 * reply read decides, not who wrote last. Without a record (no reply has
 * finished in the session), the user having the last word does.
 */
export default function hasUnansweredMessage({ history, answered_id }: Params) {
    const user_ids = history
        .filter((message) => message.author == "user")
        .map((message) => Number(message.id));

    if (!user_ids.length) return false;

    if (answered_id) {
        return Math.max(...user_ids) > answered_id;
    }

    return history[history.length - 1]?.author == "user";
}
