import { useEffect, useState } from "react";
import type { BotSessionListItem } from "@/src/types";
import postSessionApi from "../(functions)/post-session-api";

type Params = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Loads only while the modal is open.
     */
    open: boolean;
};

/**
 * A conversation's sessions, latest first, searched as the user types
 * (debounced). Starting or reopening a session reloads the page onto it.
 */
export default function useBotSessions({ bot_id, workspace_id, open }: Params) {
    const [query, setQuery] = useState("");
    const [sessions, setSessions] = useState<BotSessionListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [busy_id, setBusyId] = useState<number | "new">();
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!open) return;

        let stale = false;
        const timer = setTimeout(async () => {
            setLoading(true);

            const res = await postSessionApi<BotSessionListItem>({
                path: "list-sessions",
                body: { bot_id, workspace_id, query: query.trim() || undefined },
            }).catch(() => null);

            if (stale) return;

            setLoading(false);

            if (res?.success) {
                setSessions(res.payload || []);
                setError(undefined);
            } else {
                setError(res?.msg || "Couldn't load the sessions.");
            }
        }, query ? 250 : 0);

        return () => {
            stale = true;
            clearTimeout(timer);
        };
    }, [open, query, bot_id, workspace_id]);

    const act = async ({ id, path, body }: { id: number | "new"; path: "new-session" | "reopen-session"; body: Record<string, unknown> }) => {
        if (busy_id) return;

        setBusyId(id);
        setError(undefined);

        const res = await postSessionApi({ path, body }).catch(() => null);

        if (res?.success) {
            window.location.reload();
            return;
        }

        setBusyId(undefined);
        setError(res?.msg || "That didn't work.");
    };

    return {
        query,
        setQuery,
        sessions,
        loading,
        busy_id,
        error,
        startSession: () => act({ id: "new", path: "new-session", body: { bot_id, workspace_id } }),
        reopenSession: ({ session_id }: { session_id: number }) =>
            act({ id: session_id, path: "reopen-session", body: { session_id } }),
    };
}
