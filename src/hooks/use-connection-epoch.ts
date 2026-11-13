"use client";

import { useEffect, useState } from "react";
import { AppData } from "@/src/data/app-data";

/**
 * Changes after a reason the socket may have died: the browser went back
 * online, the page was restored, a hidden tab became visible again, or
 * another window was focused (a phone locked while the socket closed).
 * twui's `useWebSocket` gives up after three attempts, so the socket is
 * remounted instead of waiting for a reload. A second trigger within
 * `AppData.RefocusGapMs` is the same return.
 */
export default function useConnectionEpoch() {
    const [epoch, setEpoch] = useState(0);

    useEffect(() => {
        let last = 0;

        const bump = () => {
            const now = Date.now();

            if (now - last < AppData.RefocusGapMs) return;

            last = now;
            setEpoch((value) => value + 1);
        };

        const onVisible = () => {
            if (document.visibilityState == "visible") bump();
        };

        window.addEventListener("online", bump);
        window.addEventListener("pageshow", bump);
        window.addEventListener("focus", bump);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.removeEventListener("online", bump);
            window.removeEventListener("pageshow", bump);
            window.removeEventListener("focus", bump);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, []);

    return epoch;
}
