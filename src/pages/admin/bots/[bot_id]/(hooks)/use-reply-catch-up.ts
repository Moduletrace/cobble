import { useEffect, useRef } from "react";
import { AppData } from "@/src/data/app-data";
import type {
    BotMessageWithAttachments,
    SessionMessagesResponse,
    WebSocketDataType,
} from "@/src/types";
import postSessionApi from "@/src/functions/frontend/post-session-api";

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
 * thinking row can't stay up until a reload. It also checks at once when
 * the page comes back into view or online. A missed message is replayed
 * as the `server:bot-message` it would have been, so the thread, the rail
 * and the unread flag all take it the usual way. The bot's face, status
 * line and active task are replayed too, as `server:bot-updated`, so a
 * reply that ended without a final message (its face push missed) can't
 * leave the bot working on screen.
 */
export default function useReplyCatchUp({ session_id, awaiting_reply, last_message_id }: Params) {
    const last_message = useRef(Number(last_message_id) || 0);

    last_message.current = Number(last_message_id) || 0;

    useEffect(() => {
        if (!awaiting_reply || !session_id) return;

        let stale = false;

        const replay = ({ data }: { data: WebSocketDataType }) =>
            window.dispatchEvent(new CustomEvent("wsDataEvent", { detail: { data, message: data } }));

        const check = async () => {
            const res = (await postSessionApi<BotMessageWithAttachments>({
                path: "session-messages",
                body: { session_id },
            }).catch(() => null)) as SessionMessagesResponse | null;

            if (stale || !res?.success || !Array.isArray(res.payload)) return;

            const missed = res.payload.filter(
                (message) => Number(message.id) > last_message.current,
            );

            for (const message of missed) {
                replay({ data: { event: "server:bot-message", data: message } });
            }

            /**
             * After the messages, so a reply that ended silently (its last
             * word an interim one) drops the row once its face moves on.
             */
            if (res.bot?.id) replay({ data: { event: "server:bot-updated", data: res.bot } });
        };

        /**
         * Coming back to the app (a notification tapped, the PWA brought
         * forward) checks at once: the socket was likely down meanwhile.
         */
        const onVisible = () => {
            if (document.visibilityState == "visible") check();
        };

        const timer = setInterval(check, AppData.BotReplyCatchUpMs);

        window.addEventListener("online", check);
        window.addEventListener("pageshow", check);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            stale = true;
            clearInterval(timer);
            window.removeEventListener("online", check);
            window.removeEventListener("pageshow", check);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [awaiting_reply, session_id]);
}
