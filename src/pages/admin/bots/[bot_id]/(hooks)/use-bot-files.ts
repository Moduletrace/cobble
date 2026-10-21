import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useContext, useEffect, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { BotFileScopesPayload } from "@/src/types";

type Params = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Load the full list only once the modal opens (the page already has
     * the first page of files).
     */
    enabled?: boolean;
};

/**
 * A conversation's files: the page's own copy first, then the folder and
 * search the modal asks for. Saves and deletes refresh it.
 */
export default function useBotFiles({ bot_id, workspace_id, enabled = true }: Params) {
    const { pageProps } = useContext(AppContext);
    const [data, setData] = useState<BotFileScopesPayload | undefined>(
        pageProps?.bot_files || undefined,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const load = useCallback(
        async (params?: { folder?: string; search?: string }) => {
            setLoading(true);
            setError(undefined);

            const query = new URLSearchParams();

            if (workspace_id) query.set("workspace_id", String(workspace_id));
            else query.set("bot_id", String(bot_id));

            if (params?.folder) query.set("folder", params.folder);
            if (params?.search) query.set("search", params.search);

            const res = await fetchApi<{}, APIResponseObject<BotFileScopesPayload>>(
                `/api/admin/bots/files?${query.toString()}`,
                { method: "GET" },
            ).catch(() => null);

            setLoading(false);

            if (!res?.success || !res.singleRes) {
                setError(res?.msg || `Couldn't load the files.`);
                return;
            }

            setData(res.singleRes);
        },
        [bot_id, workspace_id],
    );

    useEffect(() => {
        if (enabled) load().catch(() => {});
    }, [enabled, load]);

    return { data, loading, error, reload: load, setData };
}
