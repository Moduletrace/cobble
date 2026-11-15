type Params = {
    /**
     * The session the conversation was in before the request took one.
     */
    previous_session_id?: number | string | null;
    /**
     * The session the request took: a session is never its own previous one
     * (`startBotSession` keeps an empty active session as it is), and a
     * request from a bot with no session before it has none at all.
     */
    session_id?: number | string | null;
};

/**
 * The session a crew request's bar leads back to, or null when there is
 * nothing to lead back to. Null hides the bar: a bot that had no session
 * before the request opened one has no conversation to return to.
 */
export default function askPreviousSessionId({
    previous_session_id,
    session_id,
}: Params): number | null {
    const previous = Number(previous_session_id) || null;
    const current = Number(session_id) || null;

    if (!previous) return null;
    if (previous === current) return null;

    return previous;
}