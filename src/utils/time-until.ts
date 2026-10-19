const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

type Params = {
    /**
     * Unix timestamp in milliseconds.
     */
    at: number;
    now?: number;
};

/**
 * The future side of `relativeTime`: `now`, `in 5m`, `in 3h`, `in 2d`,
 * `in 3w`.
 */
export default function timeUntil({ at, now = Date.now() }: Params): string {
    const diff = at - now;

    if (diff < MINUTE) return "now";
    if (diff < HOUR) return `in ${Math.floor(diff / MINUTE)}m`;
    if (diff < DAY) return `in ${Math.floor(diff / HOUR)}h`;
    if (diff < WEEK) return `in ${Math.floor(diff / DAY)}d`;

    return `in ${Math.floor(diff / WEEK)}w`;
}
