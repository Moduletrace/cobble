import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

type Params = {
    /**
     * The thread's last message.
     */
    last_message?: Pick<
        BUN_SQLITE_COBBLE_BOT_MESSAGES,
        "author" | "interim" | "failed_job_id"
    > | null;
    /**
     * The bot's face for this user.
     */
    face?: string | null;
};

/**
 * Whether a reply is due in the thread: the user has the last word, or the
 * bot's last word was sent mid-reply (`interim`, an acknowledgement while
 * it works) and it is still working, or its last word was a failure notice
 * the user retried and it is working again. Once the reply ends its face
 * moves on, so a reply that had nothing more to say never leaves the row
 * up.
 */
export default function isAwaitingReply({ last_message, face }: Params) {
    if (!last_message) return false;
    if (last_message.author == "user") return true;
    if (last_message.failed_job_id && face == "working") return true;

    return Boolean(last_message.interim) && face == "working";
}
