import { useCallback, useEffect, useState } from "react";
import type { HookProposalView } from "@/src/types";
import loadRefView, { primeRefView } from "../(utils)/ref-view-loader";

type Params = {
    proposal_id: number;
};

/**
 * A hook a bot proposed (`[hook-proposal:ID]`), for its chip and confirm
 * card: read when the chip renders, so it shows whether it's still
 * waiting. Only the user it was proposed to can read it; anyone else gets
 * null. A read that failed or hung is tried again (`loadRefView`), so the
 * card isn't unopenable until the page is reloaded.
 */
export default function useHookProposal({ proposal_id }: Params) {
    const [view, setViewState] = useState<HookProposalView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        setLoading(true);

        loadRefView<HookProposalView>({
            key: `hook-proposal:${proposal_id}`,
            url: `/api/admin/hook-proposals/get-proposal?proposal_id=${proposal_id}`,
        }).then((result) => {
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
            primeRefView({ key: `hook-proposal:${proposal_id}`, view: next });
            setViewState(next);
        },
        [proposal_id],
    );

    return { view, loading, setView };
}