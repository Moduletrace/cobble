import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import dayjs from "dayjs";
import type { UsageOverview } from "@/src/types";
import formatTokens from "@/src/utils/format-tokens";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import UsageDayBar from "./usage-day-bar";

type Props = {
    days: UsageOverview["days"];
};

/**
 * The period day by day, one bar a day, so a spike or a quiet stretch is
 * read at a glance. The busiest day's total labels the top, and each bar
 * opens a small summary of its day.
 */
export default function UsageDayChart({ days }: Props) {
    const max = days.reduce((highest, day) => Math.max(highest, day.total_tokens), 0);
    const total_tokens = days.reduce((total, day) => total + day.total_tokens, 0);
    const first = days[0];
    const last = days[days.length - 1];

    return (
        <SettingsGroup
            title="Day by day"
            description={
                max
                    ? `Busiest day: ${formatTokens({ tokens: max })} tokens.`
                    : "Nothing spent in this period yet."
            }
        >
            <Stack className="w-full gap-2!">
                <Row className="w-full gap-1! flex-nowrap items-end">
                    {days.map((day) => (
                        <UsageDayBar day={day} max={max} total_tokens={total_tokens} key={day.at} />
                    ))}
                </Row>
                {first && last ? (
                    <Row className="w-full gap-2! items-center justify-between">
                        <Span className="text-[11px] leading-4 text-ink-secondary">
                            {dayjs(first.at).format("MMM D")}
                        </Span>
                        <Span className="text-[11px] leading-4 text-ink-secondary">
                            {dayjs(last.at).format("MMM D")}
                        </Span>
                    </Row>
                ) : null}
            </Stack>
        </SettingsGroup>
    );
}
