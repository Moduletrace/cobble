import Span from "@moduletrace/twui/layout/Span";
import type { TokenUsageSummary } from "@/src/harness/usage/types";
import formatTokens from "@/src/utils/format-tokens";

type Props = {
    usage?: TokenUsageSummary | null;
};

/**
 * What one answer cost, in the row under it beside its timestamp: the
 * tokens every model call behind it spent (a chat turn, reading an image,
 * making one), the price when the provider reported it, and the fallback
 * model when one answered in place of the pick. The hover title breaks it
 * down.
 */
export default function MessageUsageChip({ usage }: Props) {
    if (!usage || usage.total_tokens <= 0) return null;

    const { prompt_tokens, completion_tokens, total_tokens, cost, calls, fallback_model, fallback_calls } = usage;
    const title = [
        `${formatTokens({ tokens: prompt_tokens })} in, ${formatTokens({ tokens: completion_tokens })} out`,
        `${calls} model ${calls == 1 ? "call" : "calls"}`,
        typeof cost == "number" && cost > 0 ? `$${cost.toFixed(4)}` : "",
        fallback_model
            ? `${fallback_calls ?? 1} answered by the fallback ${fallback_model}: the model ahead of it failed or was resting`
            : "",
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <Span
            title={title}
            className="text-[11px] leading-4 text-ink-secondary tabular-nums whitespace-nowrap cursor-help"
        >
            {formatTokens({ tokens: total_tokens })} tokens
            {fallback_model ? ` · fallback: ${fallback_model.slice(fallback_model.indexOf("/") + 1)}` : ""}
        </Span>
    );
}
