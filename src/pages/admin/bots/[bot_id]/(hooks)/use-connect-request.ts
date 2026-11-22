import { useEffect, useState } from "react";
import type { ConnectorRequestPayload } from "@/src/types";
import loadRefView from "../(utils)/ref-view-loader";

/**
 * One connect card's request: read once, then kept here, so the buttons in
 * the card can put what they just learned back into it.
 */
export default function useConnectRequest({ request_id }: { request_id: number }) {
    const [view, setView] = useState<ConnectorRequestPayload | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let live = true;

        loadRefView<ConnectorRequestPayload>({
            key: `connect:${request_id}`,
            url: `/api/admin/connectors/request?request_id=${request_id}`,
        }).then((read) => {
            if (!live) return;

            setView(read);
            setLoading(false);
        });

        return () => {
            live = false;
        };
    }, [request_id]);

    return { view, setView, loading };
}