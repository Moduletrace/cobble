import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    label: string;
    value: string;
    /**
     * A line under the figure, e.g. the comparison with an earlier period.
     */
    hint?: string;
};

/**
 * One figure of the page's totals: what it is above, the number itself
 * big, and a quiet line under it.
 */
export default function UsageStat({ label, value, hint }: Props) {
    return (
        <Stack className="grow basis-[160px] min-w-0 gap-1!">
            <Span className="text-[11px] uppercase tracking-wide text-ink-secondary">{label}</Span>
            <Span className="text-2xl leading-8 font-bold text-ink tabular-nums">{value}</Span>
            {hint ? (
                <Span className="text-[12px] leading-4 text-ink-secondary">{hint}</Span>
            ) : null}
        </Stack>
    );
}
