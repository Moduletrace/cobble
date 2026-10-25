import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import dayjs from "dayjs";
import type { UsageOverview } from "@/src/types";
import formatTokens from "@/src/utils/format-tokens";
import UsageSummaryLine from "./usage-summary-line";

type Props = {
    day: UsageOverview["days"][number];
    /**
     * Every day's tokens in the period, for the day's share.
     */
    total_tokens: number;
};

/**
 * What one day spent, in the card its bar opens: the day spelled out, then
 * its tokens, how they split, its calls, its cost and its share of the
 * period.
 */
export default function UsageDaySummary({ day, total_tokens }: Props) {
    const share = total_tokens ? Math.round((day.total_tokens / total_tokens) * 100) : 0;

    const lines = [
        { label: "Tokens", value: formatTokens({ tokens: day.total_tokens }) },
        { label: "In", value: formatTokens({ tokens: day.prompt_tokens }) },
        { label: "Out", value: formatTokens({ tokens: day.completion_tokens }) },
        { label: "Model calls", value: formatTokens({ tokens: day.calls }) },
        { label: "Cost", value: day.cost ? `$${day.cost.toFixed(2)}` : "-" },
        { label: "Share of period", value: `${share}%` },
    ];

    return (
        <Stack className="w-full gap-2! items-stretch">
            <Span className="text-[13px] leading-5 font-bold text-ink">
                {dayjs(day.at).format("dddd, MMM D")}
            </Span>
            {day.calls ? (
                <Stack className="w-full gap-1! items-stretch">
                    {lines.map((line) => (
                        <UsageSummaryLine {...line} key={line.label} />
                    ))}
                </Stack>
            ) : (
                <Span className="text-[12px] leading-4 text-ink-secondary">No model calls.</Span>
            )}
        </Stack>
    );
}
