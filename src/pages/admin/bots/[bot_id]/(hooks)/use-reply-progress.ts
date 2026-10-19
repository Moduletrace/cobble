import { useRef, useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { BotJobUpdateData } from "@/src/types";

type Params = {
    bot_id: number;
    /**
     * The open session: steps of replies in other sessions are left out.
     */
    session_id?: number | null;
    /**
     * The thread's last message. A step belongs to the reply due after it,
     * so a new message (the reply itself, or another from the user) hides
     * it.
     */
    last_message_id?: number | null;
};

type Step = {
    text: string;
    after_message_id: number | null;
};

/**
 * The latest step of the reply running in the open session (a
 * `bots_queue_updates` row's text, from `server:bot-job-update` without a
 * task), so a reply that works through tools shows what it's doing. Only
 * tool steps: the closing note is the answer itself.
 */
export default function useReplyProgress({ bot_id, session_id, last_message_id }: Params) {
    const [step, setStep] = useState<Step | null>(null);
    const last_message = useRef(last_message_id || null);

    last_message.current = last_message_id || null;

    useServerEvent({
        event: "server:bot-job-update",
        onData: (update: BotJobUpdateData) => {
            if (update.bot_id != bot_id || update.task_id || !update.text) return;

            /**
             * A turn without tools ends the reply: its text is the answer,
             * about to land as the message.
             */
            if (update.kind == "note") return;
            if (!session_id || update.session_id != session_id) return;

            setStep({ text: update.text, after_message_id: last_message.current });
        },
    });

    return step && step.after_message_id == (last_message_id || null) ? step.text : null;
}
