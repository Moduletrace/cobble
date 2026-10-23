import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import type { UsageOverview } from "@/src/types";
import formatTokens from "@/src/utils/format-tokens";
import { usageBarHeight } from "../(data)/usage-bar-heights";

type Props = {
    day: UsageOverview["days"][number];
    max: number;
};

/**
 * One day's bar in the chart: its tokens above nothing, the bar itself,
 * and the title spells the day out with what it spent. Hovering it shows
 * that title.
 */
export default function UsageDayBar({ day, max }: Props) {
    const title = `${dayjs(day.at).format("ddd, MMM D")}: ${formatTokens({ tokens: day.total_tokens })} tokens, ${daysCalls({ calls: day.calls })}`;

    return (
        <Stack
            title={title}
            className="grow basis-[3px] min-w-[3px] max-w-10 h-24 justify-end items-stretch gap-0!"
        >
            <Stack
                className={twMerge(
                    "w-full rounded-t-[2px]",
                    day.total_tokens ? "bg-ink" : "bg-hairline",
                    usageBarHeight({ value: day.total_tokens, max }),
                )}
            />
        </Stack>
    );
}

function daysCalls({ calls }: { calls: number }) {
    return `${calls} ${calls == 1 ? "call" : "calls"}`;
}
