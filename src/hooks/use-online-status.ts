"use client";

import { useEffect, useState } from "react";

/**
 * `navigator.onLine` as state. Starts online so server and first client
 * render match; the real value arrives on mount.
 */
export default function useOnlineStatus() {
    const [online, setOnline] = useState(true);

    useEffect(() => {
        const sync = () => setOnline(navigator.onLine);

        sync();
        window.addEventListener("online", sync);
        window.addEventListener("offline", sync);

        return () => {
            window.removeEventListener("online", sync);
            window.removeEventListener("offline", sync);
        };
    }, []);

    return online;
}
