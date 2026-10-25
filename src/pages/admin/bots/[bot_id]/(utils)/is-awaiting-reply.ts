import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

type Params = {
    /**
     * The thread's last message.
     */
    last_message?: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "author" | "interim"> | null;
    /**
     * The bot's face for this user.
     */
    face?: string | null;
};

/**
 * Whether a reply is due in the thread: the user has the last word, or the
 * bot's last word was sent mid-reply (`interim`, an acknowledgement while
 * it works) and it is still working. Once the reply ends its face moves
 * on, so a reply that had nothing more to say never leaves the row up.
 */
export default function isAwaitingReply({ last_message, face }: Params) {
    if (!last_message) return false;
    if (last_message.author == "user") return true;

    return Boolean(last_message.interim) && face == "working";
}
