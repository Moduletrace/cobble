type Params = {
    headers: Headers;
    now?: number;
};

/**
 * When a rate-limited provider says to come back, as Unix ms. Reads
 * `Retry-After` (seconds or a date) and `X-RateLimit-Reset` /
 * `X-RateLimit-Reset-Requests` (an epoch in ms or seconds, a number of
 * seconds, or a duration such as `6m0s`). Undefined when none is usable.
 */
export default function parseRetryAt({
    headers,
    now = Date.now(),
}: Params): number | undefined {
    const retry_after = headers.get("retry-after");

    if (retry_after) {
        const seconds = Number(retry_after);

        if (Number.isFinite(seconds)) return now + seconds * 1000;

        const date = Date.parse(retry_after);

        if (!Number.isNaN(date)) return date;
    }

    for (const name of ["x-ratelimit-reset", "x-ratelimit-reset-requests"]) {
        const value = headers.get(name);

        if (!value) continue;

        const parsed = parseResetValue({ value, now });

        if (parsed !== undefined) return parsed;
    }

    return undefined;
}

function parseResetValue({ value, now }: { value: string; now: number }) {
    const number = Number(value);

    if (Number.isFinite(number)) {
        if (number > 1e12) return number;
        if (number > 1e9) return number * 1000;
        return now + number * 1000;
    }

    const parts = [...value.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)];

    if (!parts.length) return undefined;

    const unit_ms: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
    };

    return (
        now +
        parts.reduce(
            (total, [, amount, unit]) =>
                total + Number(amount) * (unit_ms[unit || "s"] || 1000),
            0,
        )
    );
}
