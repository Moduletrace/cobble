import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    label: string;
    value: string;
};

/**
 * One figure of a day's summary card: what it is on the left, the figure
 * on the right.
 */
export default function UsageSummaryLine({ label, value }: Props) {
    return (
        <Row className="w-full gap-3! flex-nowrap items-center justify-between">
            <Span className="text-[12px] leading-4 text-ink-secondary">{label}</Span>
            <Span className="text-[12px] leading-4 text-ink tabular-nums">{value}</Span>
        </Row>
    );
}
