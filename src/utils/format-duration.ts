type Params = {
    /**
     * In milliseconds.
     */
    ms: number | null | undefined;
};

/**
 * A length of time as a person reads it: `850ms`, `4.2s`, `2m 5s`,
 * `1h 3m`. Empty for a missing or negative one.
 */
export default function formatDuration({ ms }: Params) {
    if (ms === null || ms === undefined) return "";

    const value = Number(ms);

    if (!Number.isFinite(value) || value < 0) return "";
    if (value < 1000) return `${Math.round(value)}ms`;
    if (value < 60_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}s`;

    const seconds = Math.round(value / 1000);

    if (seconds < 3600) {
        const rest = seconds % 60;
        return rest ? `${Math.floor(seconds / 60)}m ${rest}s` : `${Math.floor(seconds / 60)}m`;
    }

    const minutes = Math.round(seconds / 60);
    const rest = minutes % 60;

    return rest ? `${Math.floor(minutes / 60)}h ${rest}m` : `${Math.floor(minutes / 60)}h`;
}
