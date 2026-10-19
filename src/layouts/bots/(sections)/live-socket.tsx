"use client";

import useWebSocket from "@moduletrace/twui/hooks/useWebSocket";

/**
 * The shell's one socket. Remounted with a new key when the connection
 * may have been lost, since twui's hook stops retrying after three tries.
 */
export default function LiveSocket() {
    useWebSocket({ url: "/ws" });

    return null;
}
