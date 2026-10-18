const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Params = {
    /**
     * Unix timestamp in milliseconds.
     */
    at: number;
    now?: number;
};

/**
 * Cobble timestamps are relative, never absolute: `now`, `2m`, `1h`, `Tue`,
 * then `3w` and `2y`.
 */
export default function relativeTime({ at, now = Date.now() }: Params): string {
    const diff = Math.max(0, now - at);

    if (diff < MINUTE) return "now";
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
    if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
    if (diff < WEEK) return WEEKDAYS[new Date(at).getDay()]!;
    if (diff < 52 * WEEK) return `${Math.floor(diff / WEEK)}w`;

    return `${Math.floor(diff / (365 * DAY))}y`;
}
