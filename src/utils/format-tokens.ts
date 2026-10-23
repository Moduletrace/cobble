type Params = {
    tokens: number | null | undefined;
};

/**
 * A token count as a person reads it: exact up to a thousand, then
 * rounded to a decimal under ten thousand ("12.4K"), whole thousands up to
 * a million ("842K") and millions after it ("1.2M"). A long run's total is
 * never a wall of digits.
 */
export default function formatTokens({ tokens }: Params) {
    const count = Number(tokens) || 0;

    if (count < 1000) return String(count);
    if (count < 10_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    if (count < 1_000_000) return `${Math.round(count / 1000)}K`;

    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}
