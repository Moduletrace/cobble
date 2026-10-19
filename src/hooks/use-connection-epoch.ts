"use client";

import { useEffect, useState } from "react";

/**
 * Changes after a reason the socket may have died: the browser went back
 * online, the page was restored, or a hidden tab became visible again.
 * twui's `useWebSocket` gives up after three attempts, so the socket is
 * remounted instead of waiting for a reload.
 */
export default function useConnectionEpoch() {
    const [epoch, setEpoch] = useState(0);

    useEffect(() => {
        const bump = () => setEpoch((value) => value + 1);

        const onVisible = () => {
            if (document.visibilityState == "visible") bump();
        };

        window.addEventListener("online", bump);
        window.addEventListener("pageshow", bump);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.removeEventListener("online", bump);
            window.removeEventListener("pageshow", bump);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, []);

    return epoch;
}
