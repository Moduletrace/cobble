import { useEffect, useState } from "react";
import type { WorkspaceBotInstructions } from "@/src/types";
import fetchWorkspaceBotInstructions from "../(functions)/fetch-workspace-bot-instructions";

type Params = {
    workspace_id: number;
    bot_id: number;
    /**
     * Loads each time this turns true (the editor opens), so it starts from
     * what was last saved, the bot's own edits included.
     */
    enabled: boolean;
};

/**
 * The bot's instructions and memory for this workspace, loaded when their
 * editor opens: page props leave them out.
 */
export default function useWorkspaceBotInstructions({ workspace_id, bot_id, enabled }: Params) {
    const [instructions, setInstructions] = useState<WorkspaceBotInstructions>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        /** Cleared on close, so the next open never shows an old copy. */
        setInstructions(undefined);
        setError(undefined);

        if (!enabled || !workspace_id || !bot_id) return;

        let cancelled = false;

        fetchWorkspaceBotInstructions({ workspace_id, bot_id })
            .then((res) => {
                if (cancelled) return;

                if (res.success && res.singleRes) {
                    setInstructions(res.singleRes);
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
    }, [enabled, workspace_id, bot_id]);

    return { instructions, error };
}
