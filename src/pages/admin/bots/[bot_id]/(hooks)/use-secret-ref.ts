import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useEffect, useState } from "react";
import type { SecretRefView } from "@/src/types";

type Params = {
    env_id: number;
};

/**
 * Secret refs already read, by id. Only the key and whether the viewer may
 * reveal it: the value is fetched on Reveal or Copy and never cached here.
 */
const loaded = new Map<number, Promise<SecretRefView | null>>();

function loadSecret({ env_id }: Params) {
    const cached = loaded.get(env_id);

    if (cached) return cached;

    const pending = fetchApi<{}, APIResponseObject<SecretRefView>>(
        `/api/admin/secrets/get-secret?env_id=${env_id}`,
        { method: "GET" },
    )
        .then((res) => (res?.success && res.singleRes ? res.singleRes : null))
        .catch(() => null);

    loaded.set(env_id, pending);

    return pending;
}

/**
 * A secret a bot showed (`[secret:ID]`), for its masked chip.
 */
export default function useSecretRef({ env_id }: Params) {
    const [view, setView] = useState<SecretRefView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        loadSecret({ env_id }).then((result) => {
            if (!live) return;
            setView(result);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [env_id]);

    return { view, loading };
}
