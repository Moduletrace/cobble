import { useEffect, useRef, useState } from "react";
import postSessionApi from "@/src/functions/frontend/post-session-api";
import type { BotMessageWithAttachments, OlderBotMessagesData } from "@/src/types";

type Params = {
    session_id?: number | null;
    /**
     * The page rendered with only the session's latest messages.
     */
    has_more: boolean;
    /**
     * The thread's oldest message: the next page ends before it.
     */
    first_message_id?: number | null;
    /**
     * Takes a loaded page, oldest first, to put above the thread.
     */
    onLoaded: (params: { messages: BotMessageWithAttachments[] }) => void;
};

/**
 * Loads the session's older messages a page at a time, when the thread
 * is scrolled to its top. A session the thread moves onto starts with
 * its first message, so it has none older.
 */
export default function useOlderMessages({
    session_id,
    has_more: initial_has_more,
    first_message_id,
    onLoaded,
}: Params) {
    const [has_more, setHasMore] = useState(initial_has_more);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const first_session = useRef(session_id);

    useEffect(() => {
        if (session_id == first_session.current) return;

        setHasMore(false);
        setError(undefined);
    }, [session_id]);

    const loadOlder = async () => {
        if (loading || !has_more || !session_id || !first_message_id) return;

        setLoading(true);
        setError(undefined);

        const res = await postSessionApi<OlderBotMessagesData>({
            path: "older-messages",
            body: { session_id, before_id: first_message_id },
        }).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setError(res?.msg || "Couldn't load earlier messages.");
            return;
        }

        onLoaded({ messages: res.singleRes.messages });
        setHasMore(res.singleRes.has_more);
    };

    return { has_more, loading, error, loadOlder };
}
