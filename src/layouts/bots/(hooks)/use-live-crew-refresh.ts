import { useCallback, useEffect } from "react";
import announceLiveCrew from "@/src/functions/frontend/announce-live-crew";
import { LiveCrewRefreshRequestedEvent } from "@/src/functions/frontend/request-live-crew-refresh";
import useRefocus from "@/src/hooks/use-refocus";
import fetchLiveCrew from "../(functions)/fetch-live-crew";

type Params = {
    /**
     * The workspace the rail lists a crew for, or null for the bots' own
     * chats (`railWorkspaceId`).
     */
    workspace_id: number | null;
};

/**
 * Reads the rail's crew again when the user comes back to the page
 * (`useRefocus`), or when a page asks for it (`requestLiveCrewRefresh`,
 * the thread's pull-to-reload): faces and status lines, latest messages,
 * unread marks and the workspaces, all as they stand now. It lives in the
 * layout, so every page under it keeps the rail current without each list
 * holding its own copy. The lists take the result through
 * `cobble:live-crew-refreshed`.
 */
export default function useLiveCrewRefresh({ workspace_id }: Params) {
    const refresh = useCallback(async () => {
        const res = await fetchLiveCrew({ workspace_id }).catch(() => null);

        if (!res?.success || !res.singleRes) return;

        announceLiveCrew({
            workspace_id,
            bots: res.singleRes.bots,
            workspaces: res.singleRes.workspaces,
        });
    }, [workspace_id]);

    useRefocus({ onRefocus: () => void refresh() });

    useEffect(() => {
        window.addEventListener(LiveCrewRefreshRequestedEvent, refresh);

        return () => window.removeEventListener(LiveCrewRefreshRequestedEvent, refresh);
    }, [refresh]);
}