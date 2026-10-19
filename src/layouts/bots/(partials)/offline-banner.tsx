"use client";

import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { WifiOff } from "lucide-react";

/**
 * A hairline strip while the browser is offline. Nothing is queued for
 * later, so it says messages won't send until the connection is back.
 */
export default function OfflineBanner() {
    return (
        <Row
            role="status"
            aria-live="polite"
            className="w-full shrink-0 gap-2! flex-nowrap items-center justify-center px-4 py-2 bg-sunken border-0 border-b border-solid border-hairline"
        >
            <WifiOff size={14} aria-hidden className="shrink-0 text-ink-secondary" />
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                You're offline. Messages won't send until you reconnect.
            </Span>
        </Row>
    );
}
