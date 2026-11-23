import useServerEvent from "@/src/hooks/use-server-event";
import type { BotJobUpdateData } from "@/src/types";

type Params = {
    bot_id: number;
    /**
     * The open session: a step of a reply in another conversation is left
     * out.
     */
    session_id?: number | null;
    /**
     * Told 1 when a reply in the session takes a step. A plan step is
     * queued with no user message before it, so this is what stands the
     * thinking row over the bot's own report while the next step runs; the
     * catch-up read then keeps it current and clears it when the reply
     * lands.
     */
    on_open_jobs: (open_jobs: number) => void;
};

/**
 * A reply step pushed for the open session (`server:bot-job-update` with no
 * task) means a reply is due here, even when the bot has the last word: the
 * app queues a plan's step itself on approval and on the card under the last
 * one, so nothing in the thread's last message says it is coming.
 */
export default function useOpenReplyJobs({ bot_id, session_id, on_open_jobs }: Params) {
    useServerEvent({
        event: "server:bot-job-update",
        onData: (update: BotJobUpdateData) => {
            if (update.bot_id != bot_id || update.task_id) return;
            if (!session_id || update.session_id != session_id) return;

            on_open_jobs(1);
        },
    });
}