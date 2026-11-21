import type { BotMessageWithAttachments } from "@/src/types";
import isAwaitingReply from "./is-awaiting-reply";

type Params = {
    /**
     * The conversation went on in another session: no reply is due here.
     */
    moved_on?: boolean;
    /**
     * The message the user asked to run again, while its answer is on its
     * way.
     */
    rerun_message_id?: number | null;
    /**
     * The thread's last message.
     */
    last_message?: BotMessageWithAttachments | null;
    /**
     * The bot's face for this user, live.
     */
    face?: string | null;
    /**
     * How many replies the session still has to come, as the last read
     * found it; `null` while no read has landed.
     */
    open_reply_jobs?: number | null;
};

/**
 * Whether the thread is still waiting on a reply, so the thinking row
 * stands. The thread's own reading (`isAwaitingReply`) only sees the last
 * message and the face: a run that was stopped or pruned leaves the user's
 * message last with nothing on its way, and the row would wait forever. A
 * reply asked for again is the exception, since its job may not have been
 * claimed when the open jobs were read.
 *
 * A plan step is a reply the app queues with no user message before it, so
 * the bot's own report has the last word while the next step is already on
 * its way: an open reply job is a reply due here, whatever the last message
 * says.
 */
export default function awaitsReply({
    moved_on,
    rerun_message_id,
    last_message,
    face,
    open_reply_jobs,
}: Params) {
    if (moved_on) return false;
    if (rerun_message_id != null) return true;
    if ((open_reply_jobs ?? 0) > 0) return true;
    if (!isAwaitingReply({ last_message, face })) return false;

    return open_reply_jobs == null;
}