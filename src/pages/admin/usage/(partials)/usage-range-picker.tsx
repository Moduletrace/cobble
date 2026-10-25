import Row from "@moduletrace/twui/layout/Row";
import { UsageRanges } from "../(data)/usage-ranges";
import UsageRangeButton from "./usage-range-button";

type Props = {
    days: number;
    loading?: boolean;
    onChange: (days: number) => void;
};

/**
 * The periods the page totals, one segment each in a hairline track. The
 * one showing is filled in ink, so it reads as pressed.
 */
export default function UsageRangePicker({ days, loading, onChange }: Props) {
    return (
        <Row className="gap-0.5! p-0.5 flex-nowrap items-center rounded-default border border-solid border-hairline">
            {UsageRanges.map((range) => (
                <UsageRangeButton
                    key={range.days}
                    range={range}
                    selected={range.days == days}
                    loading={loading}
                    onChange={onChange}
                />
            ))}
        </Row>
    );
}
