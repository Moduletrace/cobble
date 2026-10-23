import Row from "@moduletrace/twui/layout/Row";
import type { UsageOverview } from "@/src/types";
import formatTokens from "@/src/utils/format-tokens";
import { UsageHarnessTitles } from "../(data)/usage-harness-titles";
import UsageStat from "./usage-stat";

type Props = {
    usage: UsageOverview;
};

/**
 * The page's headline figures for the period: what it spent, how many
 * calls that took, the price when providers report it, the busiest
 * harness, and how the total compares with the period before it.
 */
export default function UsageTotals({ usage }: Props) {
    const { totals, previous, by_harness } = usage;
    const busiest = by_harness[0];

    return (
        <Row className="w-full py-8 gap-6! items-start flex-wrap border-0 border-b border-solid border-hairline">
            <UsageStat
                label="Tokens"
                value={formatTokens({ tokens: totals.total_tokens })}
                hint={`${formatTokens({ tokens: totals.prompt_tokens })} in, ${formatTokens({ tokens: totals.completion_tokens })} out`}
            />
            <UsageStat
                label="Model calls"
                value={formatTokens({ tokens: totals.calls })}
                hint={busiest ? `${UsageHarnessTitles[busiest.harness] || busiest.harness} most of it` : undefined}
            />
            <UsageStat
                label="Cost"
                value={totals.cost ? `$${totals.cost.toFixed(2)}` : "Not reported"}
                hint={totals.cost ? "As the providers reported it" : "Free models, or no price"}
            />
            <UsageStat
                label="Previous period"
                value={changeLabel({ current: totals.total_tokens, previous: previous.total_tokens })}
                hint={`${formatTokens({ tokens: previous.total_tokens })} then`}
            />
        </Row>
    );
}

/**
 * How this period compares with the one before it: a share up or down, or
 * that there is nothing to compare with yet.
 */
function changeLabel({ current, previous }: { current: number; previous: number }) {
    if (!previous) return current ? "New" : "Nothing yet";

    const change = Math.round(((current - previous) / previous) * 100);

    if (change == 0) return "Level";

    return `${change > 0 ? "+" : ""}${change}%`;
}
