import { useCallback, useEffect, useState } from "react";
import type { MessageDetails } from "@/src/types";
import fetchMessageDetails from "../(functions)/fetch-message-details";

type Params = {
    message_id: number;
    /**
     * Load only once the modal opens, so the thread's messages stay small.
     */
    enabled?: boolean;
    /**
     * Set when the message was posted in a chatroom, so its details are read
     * from the room's route.
     */
    chatroom_id?: number;
};

/**
 * How one bot message was generated (`api/admin/bots/message-details`, or
 * the chatroom's own route for a message posted in a room), loaded when its
 * details modal opens and kept while the thread is open.
 */
export default function useMessageDetails({ message_id, enabled = true, chatroom_id }: Params) {
    const [details, setDetails] = useState<MessageDetails>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const load = useCallback(async () => {
        setLoading(true);
        setError(undefined);

        const res = await fetchMessageDetails({ message_id, chatroom_id }).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setError(res?.msg || `Couldn't load this message's details.`);
            return;
        }

        setDetails(res.singleRes);
    }, [message_id, chatroom_id]);

    useEffect(() => {
        if (enabled) load().catch(() => {});
    }, [enabled, load]);

    return { details, loading, error };
}
