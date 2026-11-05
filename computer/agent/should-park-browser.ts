type Params = {
    now: number;
    /**
     * When the browser was last used or watched.
     */
    last_active_at: number;
    /**
     * When the open tabs were last parked (or found not worth it), 0 for
     * never: nothing changed since, so they aren't looked at again.
     */
    checked_at: number;
    /**
     * Screen views open now.
     */
    viewers: number;
    /**
     * Browser tool calls running now.
     */
    holds: number;
    /**
     * Idle this long parks it; 0 never does.
     */
    park_after_ms: number;
};

/**
 * Whether the browser has sat unused and unwatched long enough to park
 * its tabs, and hasn't been parked since it was last used.
 */
export default function shouldParkBrowser({ now, last_active_at, checked_at, viewers, holds, park_after_ms }: Params) {
    if (park_after_ms <= 0 || viewers > 0 || holds > 0) return false;
    if (checked_at >= last_active_at) return false;

    return now - last_active_at >= park_after_ms;
}
