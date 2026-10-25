import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useEffect, useState } from "react";
import type { SecretRequestView } from "@/src/types";

type Params = {
    request_id: number;
};

/**
 * Secret requests already read, by id, so a thread naming one twice asks
 * once. An answer replaces its entry.
 */
const loaded = new Map<number, Promise<SecretRequestView | null>>();

function loadRequest({ request_id }: Params) {
    const cached = loaded.get(request_id);

    if (cached) return cached;

    const pending = fetchApi<{}, APIResponseObject<SecretRequestView>>(
        `/api/admin/secret-requests/get-request?request_id=${request_id}`,
        { method: "GET" },
    )
        .then((res) => (res?.success && res.singleRes ? res.singleRes : null))
        .catch(() => null);

    loaded.set(request_id, pending);

    return pending;
}

/**
 * A secret a bot asked for (`[secret-request:ID]`), for its chip and card:
 * read when the chip renders, so it shows whether it's still waiting.
 * Only the user it was asked of can read it; anyone else gets null.
 */
export default function useSecretRequest({ request_id }: Params) {
    const [view, setViewState] = useState<SecretRequestView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        loadRequest({ request_id }).then((result) => {
            if (!live) return;
            setViewState(result);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [request_id]);

    const setView = useCallback(
        (next: SecretRequestView) => {
            loaded.set(request_id, Promise.resolve(next));
            setViewState(next);
        },
        [request_id],
    );

    return { view, loading, setView };
}
