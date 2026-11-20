import { useCallback, useEffect, useState } from "react";
import type { ExtensionProposalView } from "@/src/types";
import loadRefView, { primeRefView, subscribeRefView } from "../(utils)/ref-view-loader";

type Params = {
    proposal_id: number;
};

/**
 * An extension a bot proposed (`[proposal:ID]`), for its chip and confirm
 * card: read when the chip renders, so it shows whether it's still
 * waiting. Only the super admin it was proposed to can read it; anyone
 * else gets null. A read that failed or hung is tried again
 * (`loadRefView`), so the card isn't unopenable until the page is
 * reloaded, and deciding on one card tells the thread's other cards of
 * the same proposal, so none of them goes on saying "Waiting for you".
 */
export default function useExtensionProposal({ proposal_id }: Params) {
    const [view, setViewState] = useState<ExtensionProposalView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;
        const key = `extension-proposal:${proposal_id}`;

        setLoading(true);

        const unsubscribe = subscribeRefView({
            key,
            listener: (next) => {
                if (!live) return;
                setViewState(next as ExtensionProposalView);
                setLoading(false);
            },
        });

        loadRefView<ExtensionProposalView>({
            key,
            url: `/api/admin/extension-proposals/get-proposal?proposal_id=${proposal_id}`,
        }).then((result) => {
            if (!live) return;
            setViewState(result);
            setLoading(false);
        });

        return () => {
            live = false;
            unsubscribe();
        };
    }, [proposal_id]);

    const setView = useCallback(
        (next: ExtensionProposalView) => {
            primeRefView({ key: `extension-proposal:${proposal_id}`, view: next });
            setViewState(next);
        },
        [proposal_id],
    );

    return { view, loading, setView };
}