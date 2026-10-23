import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { UsageRanges } from "../(data)/usage-ranges";

type Props = {
    days: number;
    loading?: boolean;
    onChange: (days: number) => void;
};

/**
 * The periods the page totals, one button each. The one showing is the
 * one that reads as pressed.
 */
export default function UsageRangePicker({ days, loading, onChange }: Props) {
    return (
        <Row className="gap-1! items-center">
            {UsageRanges.map((range) => (
                <Button
                    key={range.days}
                    title={range.title}
                    type="button"
                    size="small"
                    variant={range.days == days ? "outlined" : "ghost"}
                    color="text"
                    disabled={loading}
                    onClick={() => onChange(range.days)}
                    className="px-2.5! py-1! text-[12px]! rounded-default-xs"
                >
                    {range.title}
                </Button>
            ))}
        </Row>
    );
}
