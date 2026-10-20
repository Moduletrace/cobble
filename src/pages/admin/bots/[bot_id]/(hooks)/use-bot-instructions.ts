import { useEffect, useState } from "react";
import fetchBotInstructions from "../(functions)/fetch-bot-instructions";

type Params = {
    bot_id: number;
    /**
     * Loads each time this turns true (the edit form opens), so the form
     * starts from what was last saved.
     */
    enabled: boolean;
};

/**
 * The bot's core instructions for its edit form, loaded when it opens:
 * page props leave them out of every bot row.
 */
export default function useBotInstructions({ bot_id, enabled }: Params) {
    const [system_prompt, setSystemPrompt] = useState<string>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        /** Cleared on close, so the next open never shows an old copy. */
        setSystemPrompt(undefined);
        setError(undefined);

        if (!enabled || !bot_id) return;

        let cancelled = false;

        fetchBotInstructions({ bot_id })
            .then((res) => {
                if (cancelled) return;

                if (res.success && res.singleRes) {
                    setSystemPrompt(res.singleRes.system_prompt);
                } else {
                    setError(res.msg || "Couldn't load the instructions.");
                }
            })
            .catch(() => {
                if (!cancelled) setError("Couldn't load the instructions.");
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, bot_id]);

    return { system_prompt, error };
}
