import Center from "@moduletrace/twui/layout/Center";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import { UsageRanges } from "../(data)/usage-ranges";
import usageHref from "../(functions)/usage-href";
import useUsageOverview from "../(hooks)/use-usage-overview";
import UsageDayChart from "../(partials)/usage-day-chart";
import UsageHarnessBreakdown from "../(partials)/usage-harness-breakdown";
import UsageModelsTable from "../(partials)/usage-models-table";
import UsageRangePicker from "../(partials)/usage-range-picker";
import UsageTotals from "../(partials)/usage-totals";

/**
 * The usage page's state: which period is totalled, kept in the address so
 * a range can be linked to. The default period comes with the page;
 * another one loads through the API.
 */
export default function UsageSection() {
    const { pageProps } = useContext(AppContext);
    const page_usage = pageProps?.usage;
    const [days, set_days] = useState(page_usage?.window.days || UsageRanges[1]!.days);
    const { usage, loading, error } = useUsageOverview({ days, page_usage });

    const changeRange = (next_days: number) => {
        set_days(next_days);

        const url = new URL(usageHref({ days: next_days }), window.location.origin);

        history.pushState(null, "", url);
    };

    return (
        <>
            <Row className="w-full pt-6 gap-4! items-center justify-between flex-wrap">
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    Every model call the crew made, whether it answered in chat, read an image,
                    spoke or made one.
                </Span>
                <UsageRangePicker days={days} loading={loading} onChange={changeRange} />
            </Row>
            {error ? (
                <Center className="p-16">
                    <Span size="small">{error}</Span>
                </Center>
            ) : !usage ? (
                <Center className="p-16">
                    <Span size="small">Reading the usage...</Span>
                </Center>
            ) : (
                <UsageTotals usage={usage} />
            )}
            {usage ? <UsageDayChart days={usage.days} /> : null}
            {usage ? <UsageHarnessBreakdown rows={usage.by_harness} /> : null}
            {usage ? <UsageModelsTable rows={usage.models} days={usage.window.days} /> : null}
        </>
    );
}
