import { useCallback, useEffect, useRef, useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { BotJobUpdateData } from "@/src/types";
import isNewerStep from "../(utils)/is-newer-step";

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
    /**
     * The step the server still has for the open reply, read with the
     * history: a page that just loaded shows what the run is doing at once
     * rather than only the row's label, waiting for its next push (the
     * catch-up replays the newer ones).
     */
    seed?: BotJobUpdateData | null;
};

type Step = {
    id: number;
    text: string;
    after_message_id: number | null;
    /**
     * The session it was read in: another one's step never shows here.
     */
    session_id: number | null;
};

/**
 * The latest step of the reply running in the open session (a
 * `bots_queue_updates` row's text, from `server:bot-job-update` without a
 * task), so a reply that works through tools shows what it's doing. Only
 * tool steps: the closing note is the answer itself. The steps the server
 * still holds (the history's, the catch-up's replay) are taken the same
 * way, and never take the row back a line.
 */
export default function useReplyProgress({
    bot_id,
    session_id,
    last_message_id,
    seed,
}: Params) {
    const [step, setStep] = useState<Step | null>(null);
    const last_message = useRef(last_message_id || null);

    last_message.current = last_message_id || null;

    const adopt = useCallback((update: BotJobUpdateData) => {
        const taken: Step = {
            id: Number(update.id),
            text: update.text as string,
            after_message_id: last_message.current,
            session_id: Number(update.session_id) || null,
        };

        setStep((shown) => (isNewerStep({ shown, step: taken }) ? taken : shown));
    }, []);

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

            adopt(update);
        },
    });

    /**
     * Read again with the history, so it lands once the thread shows the
     * messages it belongs after (it's keyed to the last one).
     */
    useEffect(() => {
        if (!seed?.id || !seed.text) return;

        adopt(seed);
    }, [seed, last_message_id, adopt]);

    return step &&
        step.session_id == (session_id || null) &&
        step.after_message_id == (last_message_id || null)
        ? step.text
        : null;
}