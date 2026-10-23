import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { UsageOverview } from "@/src/types";
import formatTokens from "@/src/utils/format-tokens";
import { UsageHarnessTitles } from "../(data)/usage-harness-titles";

type Props = {
    row: UsageOverview["models"][number];
};

/**
 * One model's line: which provider and model it was, what it was used for,
 * how many calls and tokens it took, and the price of a thousand tokens
 * worked out from both, which is what makes models comparable.
 */
export default function UsageModelRow({ row }: Props) {
    const per_thousand = row.cost && row.total_tokens
        ? `$${((row.cost / row.total_tokens) * 1000).toFixed(3)}`
        : "-";

    return (
        <Row className="w-full py-2.5 gap-3! items-center border-0 border-b border-solid border-hairline last:border-b-0">
            <Stack className="grow min-w-0 gap-0!">
                <Span className="text-[13px] leading-5 text-ink truncate" title={row.model_slug}>
                    {row.model_name || row.model_slug}
                </Span>
                <Span className="text-[11px] leading-4 text-ink-secondary truncate">
                    {row.provider_name} - {UsageHarnessTitles[row.harness] || row.harness}
                </Span>
            </Stack>
            <Span className="text-[12px] leading-4 text-ink-secondary tabular-nums w-14 text-right">
                {formatTokens({ tokens: row.calls })}
            </Span>
            <Span className="text-[12px] leading-4 text-ink-secondary tabular-nums w-16 text-right">
                {formatTokens({ tokens: row.prompt_tokens })}
            </Span>
            <Span className="text-[12px] leading-4 text-ink-secondary tabular-nums w-16 text-right">
                {formatTokens({ tokens: row.completion_tokens })}
            </Span>
            <Span className="text-[13px] leading-5 text-ink tabular-nums w-16 text-right">
                {formatTokens({ tokens: row.total_tokens })}
            </Span>
            <Span className="text-[12px] leading-4 text-ink-secondary tabular-nums w-16 text-right">
                {per_thousand}
            </Span>
            <Span className="text-[12px] leading-4 text-ink-secondary tabular-nums w-14 text-right">
                {row.cost ? `$${row.cost.toFixed(2)}` : "-"}
            </Span>
        </Row>
    );
}
