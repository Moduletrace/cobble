import { useEffect, useState } from "react";
import { lastShownSession, ShownSessionEvent } from "@/src/functions/frontend/announce-shown-session";
import type { ShownSession } from "@/src/types";

type Params = {
    bot_id: number;
    workspace_id?: number | null;
};

function isFor({ shown, bot_id, workspace_id }: Params & { shown: ShownSession | null }) {
    return Boolean(
        shown && shown.bot_id == bot_id && (shown.workspace_id || null) == (workspace_id || null),
    );
}

/**
 * The session the conversation page shows, when it's this conversation's
 * (`announceShownSession`): a session opened by `?session_id=`, a
 * reopened one or the active one.
 */
export default function useShownSession({ bot_id, workspace_id }: Params) {
    const [shown, setShown] = useState<ShownSession | null>(() =>
        isFor({ shown: lastShownSession, bot_id, workspace_id }) ? lastShownSession : null,
    );

    useEffect(() => {
        const listener = (e: Event) => {
            const detail = (e as CustomEvent<ShownSession>).detail;

            if (isFor({ shown: detail, bot_id, workspace_id })) setShown(detail);
        };

        window.addEventListener(ShownSessionEvent, listener);
        return () => window.removeEventListener(ShownSessionEvent, listener);
    }, [bot_id, workspace_id]);

    return shown?.session || null;
}
