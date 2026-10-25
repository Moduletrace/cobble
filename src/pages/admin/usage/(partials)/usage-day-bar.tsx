import Popover from "@moduletrace/twui/elements/Popover";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import type { UsageOverview } from "@/src/types";
import { usageBarHeight } from "../(data)/usage-bar-heights";
import UsageDaySummary from "./usage-day-summary";

type Props = {
    day: UsageOverview["days"][number];
    max: number;
    /**
     * Every day's tokens in the period, for the day's share.
     */
    total_tokens: number;
};

/**
 * One day's bar in the chart. Hovering it (or tapping it) opens a small
 * card above it summing the day up.
 */
export default function UsageDayBar({ day, max, total_tokens }: Props) {
    return (
        <Popover
            trigger="hover"
            position="top"
            debounce={80}
            targetWrapperProps={{
                className: "grow basis-[3px] min-w-[3px] max-w-10 h-24 flex flex-col justify-end cursor-pointer group",
            }}
            target={
                <Stack
                    className={twMerge(
                        "w-full gap-0! rounded-t-[2px] transition-opacity",
                        day.total_tokens ? "bg-ink group-hover:opacity-70" : "bg-hairline group-hover:bg-hairline-strong",
                        usageBarHeight({ value: day.total_tokens, max }),
                    )}
                />
            }
            className="w-56 p-3 gap-2! bg-surface dark:bg-surface border-hairline dark:border-hairline rounded-default shadow-popover"
        >
            <UsageDaySummary day={day} total_tokens={total_tokens} />
        </Popover>
    );
}
