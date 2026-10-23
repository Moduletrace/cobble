import Span from "@moduletrace/twui/layout/Span";
import type { TokenUsageSummary } from "@/src/harness/usage/types";
import formatTokens from "@/src/utils/format-tokens";

type Props = {
    usage?: TokenUsageSummary | null;
};

/**
 * What one answer cost, in the row under it beside its timestamp: the
 * tokens every model call behind it spent (a chat turn, reading an image,
 * making one), and the price when the provider reported it. The hover
 * title breaks it down.
 */
export default function MessageUsageChip({ usage }: Props) {
    if (!usage || usage.total_tokens <= 0) return null;

    const { prompt_tokens, completion_tokens, total_tokens, cost, calls } = usage;
    const title = [
        `${formatTokens({ tokens: prompt_tokens })} in, ${formatTokens({ tokens: completion_tokens })} out`,
        `${calls} model ${calls == 1 ? "call" : "calls"}`,
        typeof cost == "number" && cost > 0 ? `$${cost.toFixed(4)}` : "",
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <Span
            title={title}
            className="text-[11px] leading-4 text-ink-secondary tabular-nums whitespace-nowrap cursor-help"
        >
            {formatTokens({ tokens: total_tokens })} tokens
        </Span>
    );
}
