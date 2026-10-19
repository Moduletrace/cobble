import { useEffect, useState } from "react";
import composerDraftKey from "../(utils)/composer-draft-key";

type Params = {
    bot_id?: number | "" | null;
    workspace_id?: number | null;
};

/**
 * The composer's text, kept in `localStorage` per bot and workspace until
 * it's sent, so a reload or leaving the conversation doesn't lose it.
 * Read after mount, since the page renders on the server first.
 */
export default function useComposerDraft({ bot_id, workspace_id }: Params) {
    const key = composerDraftKey({ bot_id, workspace_id, part: "text" });
    const [draft, setDraft] = useState({ key, text: "" });

    useEffect(() => {
        let text = "";

        try {
            text = localStorage.getItem(key) || "";
        } catch {}

        setDraft({ key, text });
    }, [key]);

    const setText = (text: string) => {
        setDraft({ key, text });

        try {
            if (text) localStorage.setItem(key, text);
            else localStorage.removeItem(key);
        } catch {}
    };

    return {
        text: draft.key == key ? draft.text : "",
        setText,
    };
}
