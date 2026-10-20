import { useEffect, useState } from "react";
import composerDraftKey from "../(utils)/composer-draft-key";

type Params = {
    bot_id?: number | "" | null;
    workspace_id?: number | null;
};

/**
 * The composer's text (markdown), kept in `localStorage` per bot and
 * workspace until it's sent, so a reload or leaving the conversation
 * doesn't lose it. Read after mount, since the page renders on the server
 * first; `loaded` turns true once it has been, for that `key`.
 */
export default function useComposerDraft({ bot_id, workspace_id }: Params) {
    const key = composerDraftKey({ bot_id, workspace_id, part: "text" });
    const [draft, setDraft] = useState({ key, text: "", loaded: false });

    useEffect(() => {
        let text = "";

        try {
            text = localStorage.getItem(key) || "";
        } catch {}

        setDraft({ key, text, loaded: true });
    }, [key]);

    const setText = (text: string) => {
        setDraft({ key, text, loaded: true });

        try {
            if (text) localStorage.setItem(key, text);
            else localStorage.removeItem(key);
        } catch {}
    };

    const current = draft.key == key;

    return {
        key,
        text: current ? draft.text : "",
        loaded: current && draft.loaded,
        setText,
    };
}
