import { useEffect, useRef, useState } from "react";
import type { ConversationHistory } from "@/src/types";
import fetchConversationHistory from "../(functions)/fetch-conversation-history";

type Params = {
    bot_id: number;
    workspace_id: number | null;
    /**
     * Takes each load: the thread starts over from it.
     */
    onLoaded: (params: { history: ConversationHistory }) => void;
};

/**
 * Loads the open conversation's history once the page is on screen, and
 * again whenever the browser restores the page from its back-forward
 * cache (`pageshow` with `persisted`), so going back never shows an old
 * thread. Everything else on the page (the header, the composer) comes
 * from the server and shows at once. `loaded` turns true with the first
 * load; a conversation the user can no longer open sends them where the
 * server says.
 */
export default function useConversationHistory({ bot_id, workspace_id, onLoaded }: Params) {
    const [loading, setLoading] = useState(true);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string>();
    const request = useRef(0);
    const on_loaded = useRef(onLoaded);

    on_loaded.current = onLoaded;

    const load = async () => {
        if (!bot_id) return;

        const id = ++request.current;

        setLoading(true);
        setError(undefined);

        const res = await fetchConversationHistory({ bot_id, workspace_id }).catch(() => null);

        /** A newer load started meanwhile: it has the last word. */
        if (id != request.current) return;

        if (res?.success && res.singleRes?.redirect) {
            window.location.replace(res.singleRes.redirect);
            return;
        }

        const history = res?.success ? res.singleRes?.history : null;

        setLoading(false);

        if (!history?.session?.id) {
            setError(res?.msg || "Couldn't load the conversation.");
            return;
        }

        on_loaded.current({ history });
        setLoaded(true);
    };

    useEffect(() => {
        load();

        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) load();
        };

        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, [bot_id, workspace_id]);

    return { loading, loaded, error, retry: load };
}
