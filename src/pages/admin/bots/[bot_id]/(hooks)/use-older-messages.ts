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
 * is scrolled to its top. Once the session's first message is in, the
 * session it carries on from can be opened above it (`loadPrevious`, on
 * the user's ask) and paged the same way, and so on back. Those messages
 * are only shown: the bot's prompt still reads the session it answers in.
 * A session the thread moves onto starts with its first message, so it
 * has none older; `reset` starts over from a loaded history instead.
 */
export default function useOlderMessages({
    session_id,
    has_more: initial_has_more,
    first_message_id,
    onLoaded,
}: Params) {
    const [has_more, setHasMore] = useState(initial_has_more);
    /**
     * The session the thread's top belongs to, and the one before it.
     */
    const [paging_session_id, setPagingSessionId] = useState<number | null>(session_id || null);
    const [previous_session_id, setPreviousSessionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();
    const base_session = useRef(session_id);

    useEffect(() => {
        if (session_id == base_session.current) return;

        base_session.current = session_id;
        setHasMore(false);
        setPagingSessionId(session_id || null);
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
            setPagingSessionId(session_id);
            setPreviousSessionId(previous_session_id || null);
            setError(undefined);
        },
        [],
    );

    const load = async ({ session_id, before_id }: { session_id: number; before_id?: number | null }) => {
        setLoading(true);
        setError(undefined);

        const res = await postSessionApi<OlderBotMessagesData>({
            path: "older-messages",
            body: { session_id, before_id },
        }).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setError(res?.msg || "Couldn't load earlier messages.");
            return;
        }

        onLoaded({ messages: res.singleRes.messages });
        setHasMore(res.singleRes.has_more);
        setPagingSessionId(res.singleRes.session.id);
        setPreviousSessionId(res.singleRes.session.previous_session_id);
    };

    const loadOlder = async () => {
        if (loading || !has_more || !paging_session_id || !first_message_id) return;

        await load({ session_id: paging_session_id, before_id: first_message_id });
    };

    const loadPrevious = async () => {
        if (loading || has_more || !previous_session_id) return;

        await load({ session_id: previous_session_id });
    };

    return {
        has_more,
        has_previous: !has_more && Boolean(previous_session_id),
        loading,
        error,
        loadOlder,
        loadPrevious,
        reset,
    };
}
