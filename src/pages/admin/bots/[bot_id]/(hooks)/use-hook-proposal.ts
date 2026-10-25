import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useCallback, useEffect, useState } from "react";
import type { HookProposalView } from "@/src/types";

type Params = {
    proposal_id: number;
};

/**
 * Hook proposals already read, by id, so a thread naming one twice (or a
 * re-render) asks once. A decision replaces its entry.
 */
const loaded = new Map<number, Promise<HookProposalView | null>>();

function loadProposal({ proposal_id }: Params) {
    const cached = loaded.get(proposal_id);

    if (cached) return cached;

    const pending = fetchApi<{}, APIResponseObject<HookProposalView>>(
        `/api/admin/hook-proposals/get-proposal?proposal_id=${proposal_id}`,
        { method: "GET" },
    )
        .then((res) => (res?.success && res.singleRes ? res.singleRes : null))
        .catch(() => null);

    loaded.set(proposal_id, pending);

    return pending;
}

/**
 * A hook a bot proposed (`[hook-proposal:ID]`), for its chip and confirm
 * card: read when the chip renders, so it shows whether it's still
 * waiting. Only the user it was proposed to can read it; anyone else gets
 * null.
 */
export default function useHookProposal({ proposal_id }: Params) {
    const [view, setViewState] = useState<HookProposalView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        loadProposal({ proposal_id }).then((result) => {
            if (!live) return;
            setViewState(result);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [proposal_id]);

    const setView = useCallback(
        (next: HookProposalView) => {
            loaded.set(proposal_id, Promise.resolve(next));
            setViewState(next);
        },
        [proposal_id],
    );

    return { view, loading, setView };
}
