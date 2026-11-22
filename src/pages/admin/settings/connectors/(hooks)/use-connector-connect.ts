import { useEffect, useRef, useState } from "react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ConnectorAccountRecord, ConnectorRequestPayload } from "@/src/types";

type Params = {
    /**
     * Called with the provider's own message once an account is in.
     */
    onConnected: (msg: string) => void;
    onError: (msg: string) => void;
};

type StartParams = {
    connector_id: number;
    label: string;
};

/**
 * Starts a sign-in at the provider and opens its page. The provider tells
 * this app nothing (there is no callback here), so the request's card is
 * read until the provider lists the account.
 *
 * The window is opened on the click, before the request is sent: browsers
 * only allow a popup while the click's gesture lasts, and the request's
 * round trip would spend it. Its address is set once the link comes back,
 * and `sign_in` carries the same link for a browser that blocked it anyway.
 */
export default function useConnectorConnect({ onConnected, onError }: Params) {
    const [busy, setBusy] = useState(false);
    const [sign_in, setSignIn] = useState<{ url: string; label: string }>();
    const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    useEffect(() => () => clearInterval(timer.current), []);

    const finish = (msg: string) => {
        clearInterval(timer.current);
        setBusy(false);
        setSignIn(undefined);
        onConnected(msg);
    };

    const start = async ({ connector_id, label }: StartParams) => {
        if (busy) return;

        setBusy(true);
        setSignIn(undefined);

        const popup = window.open("about:blank", "_blank");

        if (popup) popup.opener = null;

        const res = await postAdminApi<{ request: ConnectorRequestPayload | null; accounts: ConnectorAccountRecord[] }>({
            path: "connectors/start-connection",
            body: { connector_id, label },
        });

        if (!res.success || !res.singleRes) {
            popup?.close();
            setBusy(false);
            onError(res.msg || "Couldn't start the sign-in.");
            return;
        }

        if (!res.singleRes.request) {
            popup?.close();
            finish(res.msg || "Connected.");
            return;
        }

        const request = res.singleRes.request;

        setSignIn({ url: request.url, label: request.connector_name });

        if (popup && !popup.closed) {
            popup.location.replace(request.url);
        } else {
            window.open(request.url, "_blank", "noopener,noreferrer");
        }

        const request_id = request.id;
        let tries = 0;

        timer.current = setInterval(async () => {
            tries += 1;

            const status = await postAdminApi<ConnectorRequestPayload>({
                path: "connectors/connection-status",
                body: { request_id },
            });

            if (status.singleRes?.status == "connected") {
                finish(status.msg || "Connected. Its tools are ready.");
                return;
            }

            if (!status.success || status.singleRes?.status == "expired" || tries >= 60) {
                clearInterval(timer.current);
                setBusy(false);
                onError(status.msg || "The sign-in wasn't finished. Try Connect again.");
            }
        }, 3000);
    };

    return { busy, start, sign_in };
}