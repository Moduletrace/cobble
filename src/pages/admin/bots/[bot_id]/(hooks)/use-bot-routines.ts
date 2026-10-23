import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useEffect, useState } from "react";
import type { CronJobWithNames } from "@/src/types";

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
 * A conversation's routines: the schedules that run there, a bot's own in
 * its chat or the ones that run in the workspace. Loaded on open and
 * refreshed after every change, never part of the page props.
 */
export default function useBotRoutines({ bot_id, workspace_id, enabled = true }: Params) {
    const [routines, setRoutines] = useState<CronJobWithNames[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);

        const query = new URLSearchParams({ bot_id: String(bot_id) });

        if (workspace_id) query.set("workspace_id", String(workspace_id));

        const res = await fetchApi<{}, APIResponseObject<CronJobWithNames>>(
            `/api/admin/bots/list-routines?${query.toString()}`,
            { method: "GET" },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success) {
            setError(res?.msg || `Couldn't load the routines.`);
            return;
        }

        setRoutines(res.payload || []);
    }, [bot_id, workspace_id]);

    useEffect(() => {
        if (enabled) load().catch(() => {});
    }, [enabled, load]);

    return { routines, setRoutines, loading, error, reload: load };
}
