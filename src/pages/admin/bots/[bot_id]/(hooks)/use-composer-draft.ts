import { useEffect, useRef, useState } from "react";
import composerDraftKey from "../(utils)/composer-draft-key";

type Params = {
    bot_id?: number | "" | null;
    workspace_id?: number | null;
};

/**
 * How long typing rests before the draft is written. `localStorage` is
 * synchronous, so writing on every keystroke makes a phone's input wait.
 */
const WriteDelayMs = 250;

/**
 * The composer's text (markdown), kept in `localStorage` per bot and
 * workspace until it's sent, so a reload or leaving the conversation
 * doesn't lose it. Read after mount, since the page renders on the server
 * first; `loaded` turns true once it has been, for that `key`. Writes are
 * debounced and flushed on unmount or when the conversation changes.
 */
export default function useComposerDraft({ bot_id, workspace_id }: Params) {
    const key = composerDraftKey({ bot_id, workspace_id, part: "text" });
    const [draft, setDraft] = useState({ key, text: "", loaded: false });
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pending = useRef<{ key: string; text: string } | null>(null);

    const flush = () => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }

        const next = pending.current;

        pending.current = null;

        if (!next) return;

        try {
            if (next.text) localStorage.setItem(next.key, next.text);
            else localStorage.removeItem(next.key);
        } catch {}
    };

    useEffect(() => {
        flush();

        let text = "";

        try {
            text = localStorage.getItem(key) || "";
        } catch {}

        setDraft({ key, text, loaded: true });
    }, [key]);

    useEffect(() => () => flush(), []);

    const setText = (text: string) => {
        setDraft({ key, text, loaded: true });

        pending.current = { key, text };

        if (timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(flush, WriteDelayMs);
    };

    const current = draft.key == key;

    return {
        key,
        text: current ? draft.text : "",
        loaded: current && draft.loaded,
        setText,
    };
}
