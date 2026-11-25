import { useCallback, useEffect, useRef, useState } from "react";
import postSessionApi from "@/src/functions/frontend/post-session-api";
import type { BotMessageWithAttachments, OlderBotMessagesData } from "@/src/types";

type Params = {
    session_id?: number | null;
    /**
     * The thread starts with only the session's latest messages.
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
 * is scrolled to its top. The session it carries on from is opened as its
 * own page (its id is handed back for the link), never in place: the bot's
 * prompt reads the session it answers in, not this one. A session the
 * thread moves onto starts with its first message, so it has none older;
 * `reset` starts over from a loaded history instead.
 */
export default function useOlderMessages({
    session_id,
    has_more: initial_has_more,
    first_message_id,
    onLoaded,
}: Params) {
    const [has_more, setHasMore] = useState(initial_has_more);
    const [previous_session_id, setPreviousSessionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const base_session = useRef(session_id);

    useEffect(() => {
        if (session_id == base_session.current) return;

        base_session.current = session_id;
        setHasMore(false);
        setPreviousSessionId(null);
        setError(undefined);
    }, [session_id]);

    /**
     * A history loaded for the session: whether it has older messages,
     * and the session it carries on from.
     */
    const reset = useCallback(
        ({
            session_id,
            has_more,
            previous_session_id,
        }: {
            session_id: number;
            has_more: boolean;
            previous_session_id?: number | null;
        }) => {
            base_session.current = session_id;
            setHasMore(has_more);
            setPreviousSessionId(previous_session_id || null);
            setError(undefined);
        },
        [],
    );

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
        setPreviousSessionId(res.singleRes.session.previous_session_id);
    };

    return {
        has_more,
        previous_session_id,
        loading,
        error,
        loadOlder,
        reset,
    };
}
