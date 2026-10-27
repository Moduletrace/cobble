import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useEffect, useState } from "react";
import type { TaskWithNames } from "@/src/types";

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
 * A conversation's tasks: a bot's own list, or in a workspace the ones it
 * has there plus the shared ones nobody has yet. Loaded on open and refreshed after every change,
 * never part of the page props.
 */
export default function useBotTasks({ bot_id, workspace_id, enabled = true }: Params) {
    const [tasks, setTasks] = useState<TaskWithNames[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);

        const query = new URLSearchParams();

        query.set("bot_id", String(bot_id));
        if (workspace_id) query.set("workspace_id", String(workspace_id));

        const res = await fetchApi<{}, APIResponseObject<TaskWithNames>>(
            `/api/admin/tasks/list-tasks?${query.toString()}`,
            { method: "GET" },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success) {
            setError(res?.msg || `Couldn't load the tasks.`);
            return;
        }

        setTasks(res.payload || []);
    }, [bot_id, workspace_id]);

    useEffect(() => {
        if (enabled) load().catch(() => {});
    }, [enabled, load]);

    return { tasks, setTasks, loading, error, reload: load };
}
