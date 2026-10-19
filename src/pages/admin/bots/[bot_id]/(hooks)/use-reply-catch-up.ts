import { useEffect, useRef } from "react";
import { AppData } from "@/src/data/app-data";
import type { BotMessageWithAttachments, WebSocketDataType } from "@/src/types";
import postSessionApi from "../(functions)/post-session-api";

type Params = {
    session_id?: number | null;
    /**
     * The thread's last message is the user's, so a reply is due.
     */
    awaiting_reply: boolean;
    /**
     * The thread's last message: only newer ones are replayed.
     */
    last_message_id?: number | null;
};

/**
 * While a reply is due, checks the session's latest messages every
 * `AppData.BotReplyCatchUpMs`. Replies arrive live; this only catches one
 * whose push was missed (the socket was down at the time), so the
 * thinking row can't stay up until a reload. A missed message is replayed
 * as the `server:bot-message` it would have been, so the thread, the rail
 * and the unread flag all take it the usual way.
 */
export default function useReplyCatchUp({ session_id, awaiting_reply, last_message_id }: Params) {
    const last_message = useRef(Number(last_message_id) || 0);

    last_message.current = Number(last_message_id) || 0;

    useEffect(() => {
        if (!awaiting_reply || !session_id) return;

        let stale = false;

        const timer = setInterval(async () => {
            const res = await postSessionApi<BotMessageWithAttachments>({
                path: "session-messages",
                body: { session_id },
            }).catch(() => null);

            if (stale || !res?.success || !Array.isArray(res.payload)) return;

            const missed = (res.payload as BotMessageWithAttachments[]).filter(
                (message) => Number(message.id) > last_message.current,
            );

            for (const message of missed) {
                const data: WebSocketDataType = { event: "server:bot-message", data: message };

                window.dispatchEvent(new CustomEvent("wsDataEvent", { detail: { data, message: data } }));
            }
        }, AppData.BotReplyCatchUpMs);

        return () => {
            stale = true;
            clearInterval(timer);
        };
    }, [awaiting_reply, session_id]);
}
