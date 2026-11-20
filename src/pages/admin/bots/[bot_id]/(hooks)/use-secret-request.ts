import { useCallback, useEffect, useState } from "react";
import type { SecretRequestView } from "@/src/types";
import loadRefView, { primeRefView, subscribeRefView } from "../(utils)/ref-view-loader";

type Params = {
    request_id: number;
};

/**
 * A secret a bot asked for (`[secret-request:ID]`), for its chip and card:
 * read when the chip renders, so it shows whether it's still waiting.
 * Only the user it was asked of can read it; anyone else gets null. A
 * read that failed or hung is tried again (`loadRefView`), so the card
 * isn't unopenable until the page is reloaded, and answering one card
 * tells the thread's other cards of the same request.
 */
export default function useSecretRequest({ request_id }: Params) {
    const [view, setViewState] = useState<SecretRequestView | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;
        const key = `secret-request:${request_id}`;

        setLoading(true);

        const unsubscribe = subscribeRefView({
            key,
            listener: (next) => {
                if (!live) return;
                setViewState(next as SecretRequestView);
                setLoading(false);
            },
        });

        loadRefView<SecretRequestView>({
            key,
            url: `/api/admin/secret-requests/get-request?request_id=${request_id}`,
        }).then((result) => {
            if (!live) return;
            setViewState(result);
            setLoading(false);
        });

        return () => {
            live = false;
            unsubscribe();
        };
    }, [request_id]);

    const setView = useCallback(
        (next: SecretRequestView) => {
            primeRefView({ key: `secret-request:${request_id}`, view: next });
            setViewState(next);
        },
        [request_id],
    );

    return { view, loading, setView };
}