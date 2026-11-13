import { useCallback, useEffect, useRef } from "react";
import { AppData } from "@/src/data/app-data";
import type {
    BotMessageWithAttachments,
    SessionMessagesResponse,
    WebSocketDataType,
} from "@/src/types";
import postSessionApi from "@/src/functions/frontend/post-session-api";
import useRefocus from "@/src/hooks/use-refocus";

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
 * Keeps the thread from waiting on a push that never came: every return to
 * the page (`useRefocus`) reads the session's latest messages and the
 * bot's face, status line and active task, and while a reply is due it
 * does so every `AppData.BotReplyCatchUpMs` too. A missed message is
 * replayed as the `server:bot-message` it would have been, so the thread,
 * the rail and the unread flag all take it the usual way. The bot's face,
 * status line and active task are replayed as `server:bot-updated`, so a
 * reply that ended without a final message (its face push missed) can't
 * leave the bot thinking or a finished task on screen. Reading it even
 * when no reply is due is what lets a row stuck on a stale face or task
 * clear itself without a reload.
 */
export default function useReplyCatchUp({ session_id, awaiting_reply, last_message_id }: Params) {
    const last_message = useRef(Number(last_message_id) || 0);
    /**
     * The open session: a read that lands after the thread moved to
     * another one is dropped instead of replaying into the wrong thread.
     */
    const open_session = useRef(session_id);

    last_message.current = Number(last_message_id) || 0;
    open_session.current = session_id;

    const check = useCallback(async () => {
        if (!session_id) return;

        const res = (await postSessionApi<BotMessageWithAttachments>({
            path: "session-messages",
            body: { session_id },
        }).catch(() => null)) as SessionMessagesResponse | null;

        if (open_session.current != session_id) return;
        if (!res?.success || !Array.isArray(res.payload)) return;

        const replay = ({ data }: { data: WebSocketDataType }) =>
            window.dispatchEvent(new CustomEvent("wsDataEvent", { detail: { data, message: data } }));

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
    }, [session_id]);

    useRefocus({ onRefocus: () => void check() });

    /**
     * While a reply is due, a poll covers a reply whose push was missed
     * while the page stayed in front (a socket that dropped silently).
     */
    useEffect(() => {
        if (!awaiting_reply || !session_id) return;

        const timer = setInterval(() => void check(), AppData.BotReplyCatchUpMs);

        return () => clearInterval(timer);
    }, [awaiting_reply, session_id, check]);

    /**
     * The socket was down while the page stayed open: going back online or
     * restoring it from the back-forward cache checks at once.
     */
    useEffect(() => {
        window.addEventListener("online", check);
        window.addEventListener("pageshow", check);

        return () => {
            window.removeEventListener("online", check);
            window.removeEventListener("pageshow", check);
        };
    }, [check]);
}