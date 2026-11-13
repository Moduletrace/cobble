import { useCallback, useEffect, useState } from "react";
import type { BotTraceJob } from "@/src/types";
import fetchMessageTrace from "../(functions)/fetch-message-trace";

type Params = {
    message_id: number;
    /**
     * Set when the message was posted in a chatroom, so its run is read
     * through the room's access.
     */
    chatroom_id?: number;
    /**
     * Read only once the debug logs tab is open, so the modal's first tab
     * doesn't wait on a long run's trace.
     */
    enabled?: boolean;
};

/**
 * The trace behind one message (`api/admin/bots/message-trace`), for the
 * debug logs tab of its Details modal. Read when that tab opens, and kept
 * while the modal is open.
 */
export default function useMessageTrace({ message_id, chatroom_id, enabled = true }: Params) {
    const [jobs, setJobs] = useState<BotTraceJob[]>();
    const [loading, set_loading] = useState(false);
    const [error, set_error] = useState<string>();

    const load = useCallback(async () => {
        set_loading(true);
        set_error(undefined);

        const res = await fetchMessageTrace({ message_id, chatroom_id }).catch(() => null);

        set_loading(false);

        if (!res?.success || !res.singleRes) {
            set_error(res?.msg || `Couldn't load this message's debug logs.`);
            return;
        }

        setJobs(res.singleRes);
    }, [message_id, chatroom_id]);

    useEffect(() => {
        if (enabled) load().catch(() => {});
    }, [enabled, load]);

    return { jobs, loading, error, reload: load };
}