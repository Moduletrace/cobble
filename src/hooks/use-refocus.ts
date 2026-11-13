"use client";

import { useEffect, useRef } from "react";

/**
 * A window regaining focus and its tab becoming visible are often one
 * return (a phone brings the page back and focuses it), and each may fire
 * more than once. A second call this soon after a refresh is the same
 * return.
 */
export const RefocusGapMs = 1000;

type Params = {
    onRefocus: () => void;
};

/**
 * Calls `onRefocus` when the user comes back to the page: another window
 * was focused, or a hidden tab (a phone, a notification tapped) became
 * visible again. Pushes that arrived while the page was in the background
 * never reach it, so what it shows may be stale until it reads it again.
 */
export default function useRefocus({ onRefocus }: Params) {
    const handler = useRef(onRefocus);

    handler.current = onRefocus;

    useEffect(() => {
        let last = 0;

        const refresh = () => {
            const now = Date.now();

            if (now - last < RefocusGapMs) return;

            last = now;
            handler.current();
        };

        const onVisible = () => {
            if (document.visibilityState == "visible") refresh();
        };

        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, []);
}