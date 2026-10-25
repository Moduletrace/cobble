/**
 * A price in USD, precise enough for a single model call. "Not reported"
 * when the provider gave none (free models, most local ones).
 */
export default function costLabel({ cost }: { cost?: number | null }) {
    if (typeof cost != "number" || !(cost > 0)) return "Not reported";

    return `$${cost < 0.01 ? cost.toFixed(6) : cost.toFixed(4)}`;
}
