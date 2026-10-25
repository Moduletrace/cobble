import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useEffect, useState } from "react";
import type { BotHookWithNames } from "@/src/types";

type Params = {
    bot_id: number;
    workspace_id?: number | null;
    /**
     * Load only once the modal opens, so the conversation's page props stay
     * small.
     */
    enabled?: boolean;
};

/**
 * A conversation's hooks of the user: a bot's own in its chat or the ones
 * that run in the workspace. Loaded on open, never part of the page props.
 */
export default function useBotHooks({ bot_id, workspace_id, enabled = true }: Params) {
    const [hooks, setHooks] = useState<BotHookWithNames[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);

        const query = new URLSearchParams({ bot_id: String(bot_id) });

        if (workspace_id) query.set("workspace_id", String(workspace_id));

        const res = await fetchApi<{}, APIResponseObject<BotHookWithNames>>(
            `/api/admin/hooks/list-hooks?${query.toString()}`,
            { method: "GET" },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success) {
            setError(res?.msg || `Couldn't load the hooks.`);
            return;
        }

        setHooks(res.payload || []);
    }, [bot_id, workspace_id]);

    useEffect(() => {
        if (enabled) load().catch(() => {});
    }, [enabled, load]);

    return { hooks, setHooks, loading, error, reload: load };
}
