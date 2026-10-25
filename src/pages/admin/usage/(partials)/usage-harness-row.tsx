import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { UsageOverview } from "@/src/types";
import formatTokens from "@/src/utils/format-tokens";
import { UsageHarnessTitles } from "../(data)/usage-harness-titles";
import { UsageHarnessColumns } from "../(data)/usage-table-columns";

type Props = {
    row: UsageOverview["by_harness"][number];
    /**
     * Every harness's tokens in the period, for the share.
     */
    total_tokens: number;
};

/**
 * One harness's line in the breakdown: what it is, its share of the
 * period's tokens, and what it spent.
 */
export default function UsageHarnessRow({ row, total_tokens }: Props) {
    const share = total_tokens ? Math.round((row.total_tokens / total_tokens) * 100) : 0;

    return (
        <Row
            className={twMerge(
                UsageHarnessColumns,
                "w-full py-2 gap-3! items-center border-0 border-b border-solid border-hairline last:border-b-0",
            )}
        >
            <Span className="text-[13px] leading-5 text-ink min-w-0 truncate">
                {UsageHarnessTitles[row.harness] || row.harness}
            </Span>
            <Span className="text-[12px] leading-4 text-ink-secondary tabular-nums text-right truncate">
                {share}%
            </Span>
            <Span className="text-[13px] leading-5 text-ink tabular-nums text-right truncate">
                {formatTokens({ tokens: row.total_tokens })}
            </Span>
            <Span className="text-[12px] leading-4 text-ink-secondary tabular-nums text-right truncate">
                {row.cost ? `$${row.cost.toFixed(2)}` : "-"}
            </Span>
        </Row>
    );
}
